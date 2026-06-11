import bcrypt from 'bcryptjs'
import jwt, { JwtPayload } from 'jsonwebtoken'
import { randomBytes } from 'crypto'
import { DataSource, EntityManager } from 'typeorm'
import { FlowOpsLoginActivity, FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { SELF_ACCESS_TOKEN_COOKIE, SELF_REFRESH_TOKEN_COOKIE, getSelfJwtAuthTokenSecret, getSelfJwtRefreshTokenSecret } from '../secrets'

export const SELF_AUTH_COOKIE_NAMES = {
    access: SELF_ACCESS_TOKEN_COOKIE,
    refresh: SELF_REFRESH_TOKEN_COOKIE
}

export type FlowOpsLoggedInUser = {
    id: string
    email: string
    name?: string | null
    status?: string
    role?: string
    isSSO: boolean
    activeOrganizationId?: string
    activeOrganizationSubscriptionId?: string | null
    activeOrganizationCustomerId?: string | null
    activeOrganizationProductId?: string | null
    activeWorkspaceId?: string
    activeWorkspace?: string
    lastLogin?: Date | null
    isOrganizationAdmin: boolean
    assignedWorkspaces: Array<{
        id: string
        name: string
        roleId: string
        role: string
        organizationId: string
    }>
    permissions: string[]
    features: Record<string, boolean>
    token?: string
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

export class FlowOpsAuthError extends Error {
    statusCode: number

    constructor(statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode
    }
}

const normalizeEmail = (email?: string): string => (email ?? '').trim().toLowerCase()

const getPasswordFromRegisterBody = (body: RegisterBody): string => body.user?.credential ?? body.user?.password ?? ''

const parsePermissions = (role?: FlowOpsRole | null): string[] => {
    if (!role?.permissions) return []
    try {
        const parsed = JSON.parse(role.permissions)
        return Array.isArray(parsed) ? parsed : []
    } catch {
        return []
    }
}

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

export const createSelfAuthTokens = (user: Pick<FlowOpsLoggedInUser, 'id' | 'activeWorkspaceId'>) => {
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
    constructor(private readonly dataSource: DataSource) {}

    async registerAccount(body: RegisterBody): Promise<FlowOpsLoggedInUser> {
        const email = normalizeEmail(body.user?.email)
        const password = getPasswordFromRegisterBody(body)
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')
        if (!password) throw new FlowOpsAuthError(400, 'Password is required')

        return await this.dataSource.transaction(async (manager) => {
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
                return await this.getLoggedInUser(savedUser.id, workspace.id, manager)
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

            invitedUser.name = body.user?.name ?? invitedUser.name
            invitedUser.credential = await bcrypt.hash(password, 10)
            invitedUser.status = 'active'
            invitedUser.tempToken = null
            invitedUser.tokenExpiry = null
            await userRepo.save(invitedUser)

            return await this.getLoggedInUser(invitedUser.id, undefined, manager)
        })
    }

    async inviteAccount(
        body: InviteBody,
        actor: FlowOpsLoggedInUser
    ): Promise<{ tempToken: string; inviteLink: string; user: FlowOpsUser }> {
        if (!actor.isOrganizationAdmin && actor.role !== 'owner' && actor.role !== 'admin') {
            throw new FlowOpsAuthError(403, 'Forbidden')
        }

        const email = normalizeEmail(body.user?.email ?? body.email)
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')

        return await this.dataSource.transaction(async (manager) => {
            const workspaceId = body.user?.workspaceId ?? body.workspaceId ?? actor.activeWorkspaceId
            if (!workspaceId) throw new FlowOpsAuthError(400, 'Workspace is required')

            const workspace = await manager.getRepository(FlowOpsWorkspace).findOneBy({ id: workspaceId })
            if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')

            const role =
                body.user?.roleId || body.roleId
                    ? await manager.getRepository(FlowOpsRole).findOneBy({ id: body.user?.roleId ?? body.roleId })
                    : await this.getRole(manager, body.user?.roleName ?? body.roleName ?? 'member')
            if (!role) throw new FlowOpsAuthError(404, 'Role not found')

            const userRepo = manager.getRepository(FlowOpsUser)
            const existing = await userRepo.findOneBy({ email })
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
                user
            }
        })
    }

    async login(body: LoginBody): Promise<FlowOpsLoggedInUser> {
        const email = normalizeEmail(body.email)
        const password = body.password ?? ''
        const userRepo = this.dataSource.getRepository(FlowOpsUser)
        const user = email ? await userRepo.findOneBy({ email }) : null
        if (!user) {
            await this.recordLoginActivity(null, '-1', undefined, 'Unknown user')
            throw new FlowOpsAuthError(401, 'Incorrect Email or Password')
        }
        if (user.status === 'disabled') {
            await this.recordLoginActivity(user.id, '-3', undefined, 'User disabled')
            throw new FlowOpsAuthError(401, 'User disabled')
        }
        if (!user.credential || !(await bcrypt.compare(password, user.credential))) {
            await this.recordLoginActivity(user.id, '-2', undefined, 'Incorrect credential')
            throw new FlowOpsAuthError(401, 'Incorrect Email or Password')
        }

        const loggedInUser = await this.getLoggedInUser(user.id)
        if (!loggedInUser.activeWorkspaceId) {
            await this.recordLoginActivity(user.id, '-4', undefined, 'No assigned workspace')
            throw new FlowOpsAuthError(401, 'No Workspace Assigned')
        }

        user.lastLogin = new Date()
        await userRepo.save(user)
        await this.recordLoginActivity(user.id, '0', undefined, 'Login Successful')

        return {
            ...loggedInUser,
            lastLogin: user.lastLogin
        }
    }

    async forgotPassword(body: ForgotPasswordBody): Promise<{ tempToken: string; resetLink: string }> {
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

        return {
            tempToken,
            resetLink: authLink('/reset-password', tempToken)
        }
    }

    async resetPassword(body: ResetPasswordBody): Promise<{ success: true }> {
        const email = normalizeEmail(body.user?.email)
        const tempToken = body.user?.tempToken?.trim()
        const password = body.user?.password ?? ''
        if (!email) throw new FlowOpsAuthError(400, 'Email is required')
        if (!tempToken) throw new FlowOpsAuthError(400, 'Token cannot be left blank!')
        if (!password) throw new FlowOpsAuthError(400, 'Password is required')

        const userRepo = this.dataSource.getRepository(FlowOpsUser)
        const user = await userRepo.findOneBy({ email, tempToken })
        if (!user || (user.tokenExpiry && user.tokenExpiry.getTime() < Date.now())) {
            throw new FlowOpsAuthError(403, 'Invalid reset token')
        }

        user.credential = await bcrypt.hash(password, 10)
        user.tempToken = null
        user.tokenExpiry = null
        if (user.status === 'invited') user.status = 'active'
        await userRepo.save(user)
        return { success: true }
    }

    async verifyAccount(body: TokenBody): Promise<{ success: true; enabled: false }> {
        if (!body.user?.tempToken) throw new FlowOpsAuthError(400, 'Token cannot be left blank!')
        return { success: true, enabled: false }
    }

    async resendVerificationEmail(): Promise<{ success: true; enabled: false }> {
        return { success: true, enabled: false }
    }

    async logout(userId?: string): Promise<{ success: true }> {
        if (userId) await this.recordLoginActivity(userId, '1', undefined, 'Logout Successful')
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
            name: user.name,
            status: user.status,
            role: activeRole?.name,
            isSSO: false,
            activeOrganizationId: activeWorkspace?.organizationId,
            activeOrganizationSubscriptionId: null,
            activeOrganizationCustomerId: null,
            activeOrganizationProductId: null,
            activeWorkspaceId: activeWorkspace?.id,
            activeWorkspace: activeWorkspaceEntity?.name,
            lastLogin: user.lastLogin,
            isOrganizationAdmin: activeRole?.name === 'owner' || activeRole?.name === 'admin',
            assignedWorkspaces,
            permissions: parsePermissions(activeRole),
            features: {}
        }
    }

    private async getRole(manager: EntityManager, roleName: string): Promise<FlowOpsRole> {
        const role = await manager.getRepository(FlowOpsRole).findOneBy({ name: roleName })
        if (!role) throw new FlowOpsAuthError(500, `Missing built-in role: ${roleName}`)
        return role
    }

    private async recordLoginActivity(userId: string | null, activityCode: string, ip?: string, message?: string): Promise<void> {
        const repo = this.dataSource.getRepository(FlowOpsLoginActivity)
        await repo.save(
            repo.create({
                userId,
                activityCode,
                ip,
                message
            })
        )
    }
}
