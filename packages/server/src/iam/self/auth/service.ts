import bcrypt from 'bcryptjs'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { DataSource, EntityManager } from 'typeorm'
import { FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { SELF_ACCESS_TOKEN_COOKIE, SELF_REFRESH_TOKEN_COOKIE, getSelfJwtAuthTokenSecret, getSelfJwtRefreshTokenSecret } from '../secrets'
import { parsePermissionJson } from '../rbac/permissions'
import { getSelfEnterpriseFeatures } from '../features'
import { FlowOpsAuthError, FlowOpsLoggedInUser } from './types'
import logger from '../../../utils/logger'
import { isSelfSmtpConfigured, sendSelfMail } from '../email/mailer'
import { buildInviteEmail, buildResetPasswordEmail } from '../email/templates'
import { assertCanAddOrganizationUser, assertUserOrganizationsWithinSeatLimit, isOrganizationUser } from '../seats'
import { FlowOpsAuditService } from '../audit/service'
import type { AuditActorContext } from '../audit/types'
import type { FlowOpsAuthenticatedAuditActor } from '../audit/context'

export { FlowOpsAuthError }
export type { FlowOpsLoggedInUser }

export const SELF_AUTH_COOKIE_NAMES = {
    access: SELF_ACCESS_TOKEN_COOKIE,
    refresh: SELF_REFRESH_TOKEN_COOKIE
}

type RegisterBody = {
    user?: {
        name?: string
        email?: string
        credential?: string
        password?: string
        tempToken?: string
    }
}

type LoginBody = {
    email?: string
    password?: string
}

type InviteBody = {
    email?: string
    name?: string
    roleId?: string
    roleName?: string
    workspaceId?: string
    workspace?: {
        id?: string
    }
    role?: {
        id?: string
        name?: string
    }
    user?: {
        email?: string
        name?: string
        roleId?: string
        roleName?: string
        workspaceId?: string
    }
}

type ForgotPasswordBody = {
    user?: {
        email?: string
    }
}

type ResetPasswordBody = {
    user?: {
        email?: string
        tempToken?: string
        password?: string
    }
}

type TokenBody = {
    user?: {
        tempToken?: string
    }
}

export type SelfAuthTokenPayload = JwtPayload & {
    sub: string
    activeWorkspaceId?: string
    tokenType: 'access' | 'refresh'
}

const normalizeEmail = (email?: string): string => (email ?? '').trim().toLowerCase()

const getPasswordFromRegisterBody = (body: RegisterBody): string => body.user?.credential ?? body.user?.password ?? ''

const parsePermissions = (role?: FlowOpsRole | null): string[] => parsePermissionJson(role?.permissions)

const authLink = (path: string, token: string): string => {
    const baseUrl = process.env.APP_URL?.replace(/\/$/, '') || 'http://localhost:3000'
    return `${baseUrl}${path}?token=${encodeURIComponent(token)}`
}

const makeToken = (): string => randomBytes(32).toString('hex')

const tokenExpiry = (): Date => new Date(Date.now() + 24 * 60 * 60 * 1000)

const asMinutes = (value: string | undefined, fallback: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

const jwtExpiresInSeconds = (minutes: number): number => Math.floor(minutes * 60)

export const createSelfAuthTokens = (user: { id: string; activeWorkspaceId?: string }) => {
    const accessMinutes = asMinutes(process.env.JWT_TOKEN_EXPIRY_IN_MINUTES, 360)
    const refreshMinutes = asMinutes(process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES, 43200)
    const basePayload = {
        sub: user.id,
        activeWorkspaceId: user.activeWorkspaceId
    }

    return {
        accessToken: jwt.sign({ ...basePayload, tokenType: 'access' }, getSelfJwtAuthTokenSecret(), {
            expiresIn: jwtExpiresInSeconds(accessMinutes)
        }),
        refreshToken: jwt.sign({ ...basePayload, tokenType: 'refresh' }, getSelfJwtRefreshTokenSecret(), {
            expiresIn: jwtExpiresInSeconds(refreshMinutes)
        }),
        accessMaxAgeMs: accessMinutes * 60 * 1000,
        refreshMaxAgeMs: refreshMinutes * 60 * 1000
    }
}

export const verifySelfAccessToken = (token: string): SelfAuthTokenPayload => {
    const payload = jwt.verify(token, getSelfJwtAuthTokenSecret()) as SelfAuthTokenPayload
    if (payload.tokenType !== 'access' || !payload.sub) throw new FlowOpsAuthError(401, 'Invalid or Missing token')
    return payload
}

export const verifySelfRefreshToken = (token: string): SelfAuthTokenPayload => {
    const payload = jwt.verify(token, getSelfJwtRefreshTokenSecret()) as SelfAuthTokenPayload
    if (payload.tokenType !== 'refresh' || !payload.sub) throw new FlowOpsAuthError(401, 'Refresh Token Expired')
    return payload
}

export class FlowOpsAuthService {
    private readonly auditService: FlowOpsAuditService

    constructor(private readonly dataSource: DataSource) {
        this.auditService = new FlowOpsAuditService(dataSource)
    }

    async isFirstAdminSetup(): Promise<boolean> {
        return (await this.dataSource.getRepository(FlowOpsUser).count()) === 0
    }

    /**
     * 已配置 SMTP 时发送邮件并返回 true;未配置则返回 false(调用方回退到返回链接)。
     * 发送失败不抛出(不让邀请/找回流程因发信失败而整体失败),仅告警。
     */
    private async deliverSelfEmail(to: string, build: () => { subject: string; text: string; html: string }): Promise<boolean> {
        if (!isSelfSmtpConfigured()) return false
        try {
            const { subject, text, html } = build()
            await sendSelfMail({ to, subject, text, html })
            return true
        } catch (error) {
            logger.warn(`[FlowOps self IAM] 邮件发送失败 (${to}): ${error instanceof Error ? error.message : String(error)}`)
            return false
        }
    }

    async registerAccount(body: RegisterBody, requestContext: AuditActorContext): Promise<FlowOpsLoggedInUser> {
        const email = normalizeEmail(body.user?.email)
        const password = getPasswordFromRegisterBody(body)
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')
        if (!password) throw new FlowOpsAuthError(400, 'Password is required')

        const registration = await this.dataSource.transaction(async (manager) => {
            const userRepo = manager.getRepository(FlowOpsUser)
            const userCount = await userRepo.count()

            if (userCount === 0) {
                const user = userRepo.create({
                    email,
                    name: body.user?.name ?? null,
                    credential: await bcrypt.hash(password, 10),
                    status: 'active'
                })
                const savedUser = await userRepo.save(user)
                const organization = await manager.getRepository(FlowOpsOrganization).save(
                    manager.getRepository(FlowOpsOrganization).create({
                        name: 'FlowOps Organization',
                        ownerUserId: savedUser.id
                    })
                )
                const workspace = await manager.getRepository(FlowOpsWorkspace).save(
                    manager.getRepository(FlowOpsWorkspace).create({
                        name: 'Default Workspace',
                        description: 'Default FlowOps workspace',
                        organizationId: organization.id
                    })
                )
                const ownerRole = await this.getRole(manager, 'owner')
                await manager.getRepository(FlowOpsWorkspaceMember).save(
                    manager.getRepository(FlowOpsWorkspaceMember).create({
                        workspaceId: workspace.id,
                        userId: savedUser.id,
                        roleId: ownerRole.id
                    })
                )
                return {
                    loggedInUser: await this.getLoggedInUser(savedUser.id, workspace.id, manager),
                    before: null
                }
            }

            const tempToken = body.user?.tempToken?.trim()
            if (!tempToken) throw new FlowOpsAuthError(403, 'Invite token is required')

            const invitedUser = await userRepo.findOneBy({ tempToken })
            if (!invitedUser || invitedUser.email !== email || invitedUser.status !== 'invited') {
                throw new FlowOpsAuthError(403, 'Invalid invite token')
            }
            if (invitedUser.tokenExpiry && invitedUser.tokenExpiry.getTime() < Date.now()) {
                throw new FlowOpsAuthError(403, 'Invite token expired')
            }
            await assertUserOrganizationsWithinSeatLimit(manager, invitedUser.id)

            const before = { name: invitedUser.name ?? null, status: invitedUser.status }
            invitedUser.name = body.user?.name ?? invitedUser.name
            invitedUser.credential = await bcrypt.hash(password, 10)
            invitedUser.status = 'active'
            invitedUser.tempToken = null
            invitedUser.tokenExpiry = null
            await userRepo.save(invitedUser)

            return {
                loggedInUser: await this.getLoggedInUser(invitedUser.id, undefined, manager),
                before
            }
        })
        const user = registration.loggedInUser
        await this.auditService.recordAuditEvent({
            ...requestContext,
            actorUserId: user.id,
            actorEmail: user.email,
            action: 'auth.register',
            targetType: 'user',
            targetId: user.id,
            targetName: user.email,
            organizationId: user.activeOrganizationId,
            workspaceId: user.activeWorkspaceId,
            status: 'success',
            metadata: {
                before: registration.before,
                after: { name: user.name, status: user.status ?? 'active' }
            }
        })
        return user
    }

    async inviteAccount(
        body: InviteBody,
        actor: FlowOpsAuthenticatedAuditActor
    ): Promise<{ tempToken: string; inviteLink: string; user: FlowOpsUser; emailSent: boolean }> {
        if (!actor.isOrganizationAdmin && actor.role !== 'owner' && actor.role !== 'admin') {
            throw new FlowOpsAuthError(403, 'Forbidden')
        }

        const email = normalizeEmail(body.user?.email ?? body.email)
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')

        const result = await this.dataSource.transaction(async (manager) => {
            const workspaceId = body.user?.workspaceId ?? body.workspaceId ?? body.workspace?.id ?? actor.activeWorkspaceId
            if (!workspaceId) throw new FlowOpsAuthError(400, 'Workspace is required')

            const workspace = await manager.getRepository(FlowOpsWorkspace).findOneBy({ id: workspaceId })
            if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')

            const roleId = body.user?.roleId ?? body.roleId ?? body.role?.id
            const role =
                roleId !== undefined
                    ? await manager.getRepository(FlowOpsRole).findOneBy({ id: roleId })
                    : await this.getRole(manager, body.user?.roleName ?? body.roleName ?? body.role?.name ?? 'member')
            if (!role) throw new FlowOpsAuthError(404, 'Role not found')

            const userRepo = manager.getRepository(FlowOpsUser)
            const existing = await userRepo.findOneBy({ email })
            if (!existing || !(await isOrganizationUser(manager, workspace.organizationId, existing.id))) {
                await assertCanAddOrganizationUser(manager, workspace.organizationId)
            }
            const tempToken = makeToken()
            const user = await userRepo.save(
                userRepo.create({
                    ...(existing ?? {}),
                    email,
                    name: body.user?.name ?? body.name ?? existing?.name ?? null,
                    status: existing?.status === 'active' ? 'active' : 'invited',
                    tempToken,
                    tokenExpiry: tokenExpiry()
                })
            )

            const memberRepo = manager.getRepository(FlowOpsWorkspaceMember)
            const existingMember = await memberRepo.findOneBy({ workspaceId, userId: user.id })
            if (!existingMember) {
                await memberRepo.save(
                    memberRepo.create({
                        workspaceId,
                        userId: user.id,
                        roleId: role.id
                    })
                )
            }

            return {
                tempToken,
                inviteLink: authLink('/register', tempToken),
                user,
                workspaceId: workspace.id,
                workspaceName: workspace.name,
                organizationId: workspace.organizationId,
                roleId: role.id,
                roleName: role.name,
                existingUser: Boolean(existing),
                existingMembership: Boolean(existingMember)
            }
        })

        const emailSent = await this.deliverSelfEmail(email, () =>
            buildInviteEmail({ inviteLink: result.inviteLink, inviterName: actor.name, workspaceName: result.workspaceName })
        )

        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'user.invite',
            targetType: 'user',
            targetId: result.user.id,
            targetName: result.user.email,
            organizationId: result.organizationId,
            workspaceId: result.workspaceId,
            status: 'success',
            metadata: {
                before: {
                    existingUser: result.existingUser,
                    existingMembership: result.existingMembership
                },
                after: {
                    status: result.user.status,
                    roleId: result.roleId,
                    roleName: result.roleName,
                    workspaceName: result.workspaceName,
                    emailSent
                }
            }
        })

        return { tempToken: result.tempToken, inviteLink: result.inviteLink, user: result.user, emailSent }
    }

    async login(body: LoginBody, requestContext: AuditActorContext): Promise<FlowOpsLoggedInUser> {
        const email = normalizeEmail(body.email)
        const password = body.password ?? ''
        const userRepo = this.dataSource.getRepository(FlowOpsUser)
        const user = email ? await userRepo.findOneBy({ email }) : null
        if (!user) {
            await this.recordLoginEvent(requestContext, null, email, '-1', 'UNKNOWN_USER')
            throw new FlowOpsAuthError(401, 'Incorrect Email or Password')
        }
        if (user.status === 'disabled' || user.status === 'inactive') {
            await this.recordLoginEvent(requestContext, user, user.email, '-3', 'USER_DISABLED')
            throw new FlowOpsAuthError(401, 'User disabled')
        }
        if (!user.credential || !(await bcrypt.compare(password, user.credential))) {
            await this.recordLoginEvent(requestContext, user, user.email, '-2', 'INVALID_CREDENTIAL')
            throw new FlowOpsAuthError(401, 'Incorrect Email or Password')
        }

        const loggedInUser = await this.getLoggedInUser(user.id)
        if (!loggedInUser.activeWorkspaceId) {
            await this.recordLoginEvent(requestContext, user, user.email, '-4', 'NO_ASSIGNED_WORKSPACE')
            throw new FlowOpsAuthError(401, 'No Workspace Assigned')
        }

        const previousLastLogin = user.lastLogin ?? null
        user.lastLogin = new Date()
        await userRepo.save(user)
        await this.auditService.recordAuditEvent({
            ...requestContext,
            actorUserId: user.id,
            actorEmail: user.email,
            action: 'auth.login',
            targetType: 'user',
            targetId: user.id,
            targetName: user.email,
            organizationId: loggedInUser.activeOrganizationId,
            workspaceId: loggedInUser.activeWorkspaceId,
            status: 'success',
            metadata: {
                legacyActivityCode: '0',
                before: { lastLogin: previousLastLogin },
                after: { lastLogin: user.lastLogin }
            }
        })

        return {
            ...loggedInUser,
            lastLogin: user.lastLogin
        }
    }

    async forgotPassword(body: ForgotPasswordBody): Promise<{ success: true; emailSent: boolean; tempToken?: string; resetLink?: string }> {
        const email = normalizeEmail(body.user?.email)
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')

        const userRepo = this.dataSource.getRepository(FlowOpsUser)
        const user = await userRepo.findOneBy({ email })
        const tempToken = makeToken()
        if (user) {
            user.tempToken = tempToken
            user.tokenExpiry = tokenExpiry()
            await userRepo.save(user)
        }

        const resetLink = authLink('/reset-password', tempToken)
        const emailSent = user ? await this.deliverSelfEmail(email, () => buildResetPasswordEmail({ resetLink })) : false

        // 已发邮件:出于安全不再回传明文 resetLink;未配置 SMTP:回退返回链接供管理员手动转发
        if (emailSent) {
            return { success: true, emailSent: true }
        }
        return { success: true, emailSent: false, tempToken, resetLink }
    }

    async resetPassword(body: ResetPasswordBody, requestContext: AuditActorContext): Promise<{ success: true }> {
        const email = normalizeEmail(body.user?.email)
        const tempToken = body.user?.tempToken?.trim()
        const password = body.user?.password ?? ''
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')
        if (!tempToken) throw new FlowOpsAuthError(400, 'Token cannot be left blank!')
        if (!password) throw new FlowOpsAuthError(400, 'Password is required')

        const userRepo = this.dataSource.getRepository(FlowOpsUser)
        const user = await userRepo.findOneBy({ email, tempToken })
        if (!user || (user.tokenExpiry && user.tokenExpiry.getTime() < Date.now())) {
            await this.auditService.recordAuditEvent({
                ...requestContext,
                actorUserId: null,
                actorEmail: null,
                action: 'auth.passwordReset',
                targetType: 'user',
                targetId: null,
                targetName: email,
                organizationId: null,
                workspaceId: null,
                status: 'failure',
                metadata: { reason: 'INVALID_OR_EXPIRED_TOKEN' }
            })
            throw new FlowOpsAuthError(403, 'Invalid reset token')
        }

        const before = { status: user.status }
        user.credential = await bcrypt.hash(password, 10)
        user.tempToken = null
        user.tokenExpiry = null
        if (user.status === 'invited') user.status = 'active'
        await userRepo.save(user)
        const scope = await this.getUserAuditScope(user.id)
        await this.auditService.recordAuditEvent({
            ...requestContext,
            actorUserId: user.id,
            actorEmail: user.email,
            action: 'auth.passwordReset',
            targetType: 'user',
            targetId: user.id,
            targetName: user.email,
            organizationId: scope.organizationId,
            workspaceId: scope.workspaceId,
            status: 'success',
            metadata: { before, after: { status: user.status, resetTokenConsumed: true } }
        })
        return { success: true }
    }

    async verifyAccount(body: TokenBody): Promise<{ success: true; enabled: false }> {
        if (!body.user?.tempToken) throw new FlowOpsAuthError(400, 'Token cannot be left blank!')
        return { success: true, enabled: false }
    }

    async resendVerificationEmail(): Promise<{ success: true; enabled: false }> {
        return { success: true, enabled: false }
    }

    async logout(userId: string | undefined, requestContext: AuditActorContext): Promise<{ success: true }> {
        if (userId) {
            const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: userId })
            if (user) {
                const scope = await this.getUserAuditScope(user.id)
                await this.auditService.recordAuditEvent({
                    ...requestContext,
                    actorUserId: user.id,
                    actorEmail: user.email,
                    action: 'auth.logout',
                    targetType: 'user',
                    targetId: user.id,
                    targetName: user.email,
                    organizationId: scope.organizationId,
                    workspaceId: scope.workspaceId,
                    status: 'success',
                    metadata: { legacyActivityCode: '1' }
                })
            }
        }
        return { success: true }
    }

    async getLoggedInUser(userId: string, preferredWorkspaceId?: string, manager?: EntityManager): Promise<FlowOpsLoggedInUser> {
        const repositorySource = manager ?? this.dataSource
        const user = await repositorySource.getRepository(FlowOpsUser).findOneBy({ id: userId })
        if (!user) throw new FlowOpsAuthError(401, 'Invalid or Missing token')

        const memberships = await repositorySource.getRepository(FlowOpsWorkspaceMember).findBy({ userId })
        const assignedWorkspaces = []
        for (const membership of memberships) {
            const workspace = await repositorySource.getRepository(FlowOpsWorkspace).findOneBy({ id: membership.workspaceId })
            const role = await repositorySource.getRepository(FlowOpsRole).findOneBy({ id: membership.roleId })
            if (!workspace || !role) continue
            assignedWorkspaces.push({
                id: workspace.id,
                name: workspace.name,
                roleId: role.id,
                role: role.name,
                organizationId: workspace.organizationId
            })
        }

        const activeWorkspace = assignedWorkspaces.find((workspace) => workspace.id === preferredWorkspaceId) ?? assignedWorkspaces[0]
        const activeRole = activeWorkspace
            ? await repositorySource.getRepository(FlowOpsRole).findOneBy({ id: activeWorkspace.roleId })
            : null
        const activeWorkspaceEntity = activeWorkspace
            ? await repositorySource.getRepository(FlowOpsWorkspace).findOneBy({ id: activeWorkspace.id })
            : null

        return {
            id: user.id,
            email: user.email,
            name: user.name ?? '',
            status: user.status,
            role: activeRole?.name ?? '',
            isSSO: false,
            activeOrganizationId: activeWorkspace?.organizationId ?? '',
            activeOrganizationSubscriptionId: '',
            activeOrganizationCustomerId: '',
            activeOrganizationProductId: '',
            activeWorkspaceId: activeWorkspace?.id ?? '',
            activeWorkspace: activeWorkspaceEntity?.name ?? '',
            lastLogin: user.lastLogin,
            isOrganizationAdmin: activeRole?.name === 'owner',
            assignedWorkspaces,
            permissions: parsePermissions(activeRole),
            features: getSelfEnterpriseFeatures()
        }
    }

    private async getRole(manager: EntityManager, roleName: string): Promise<FlowOpsRole> {
        const role = await manager.getRepository(FlowOpsRole).findOneBy({ name: roleName })
        if (!role) throw new FlowOpsAuthError(500, `Missing built-in role: ${roleName}`)
        return role
    }

    private async recordLoginEvent(
        requestContext: AuditActorContext,
        user: FlowOpsUser | null,
        attemptedEmail: string,
        legacyActivityCode: '-1' | '-2' | '-3' | '-4',
        reason: 'UNKNOWN_USER' | 'INVALID_CREDENTIAL' | 'USER_DISABLED' | 'NO_ASSIGNED_WORKSPACE'
    ): Promise<void> {
        const scope = user ? await this.getUserAuditScope(user.id) : {}
        await this.auditService.recordAuditEvent({
            ...requestContext,
            actorUserId: user?.id ?? null,
            actorEmail: user?.email ?? null,
            action: 'auth.loginFailed',
            targetType: 'user',
            targetId: user?.id ?? null,
            targetName: attemptedEmail,
            organizationId: scope.organizationId ?? null,
            workspaceId: scope.workspaceId ?? null,
            status: 'failure',
            metadata: { legacyActivityCode, reason }
        })
    }

    private async getUserAuditScope(userId: string): Promise<{ organizationId?: string; workspaceId?: string }> {
        const membership = (await this.dataSource.getRepository(FlowOpsWorkspaceMember).findBy({ userId }))[0]
        if (!membership) return {}
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id: membership.workspaceId })
        if (!workspace) return {}
        return { organizationId: workspace.organizationId, workspaceId: workspace.id }
    }
}
