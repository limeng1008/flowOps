import { describe, expect, it, beforeEach, afterEach, jest } from '@jest/globals'
import type { DataSource } from 'typeorm'
import {
    FlowOpsAuditLog,
    FlowOpsLoginActivity,
    FlowOpsOrganization,
    FlowOpsRole,
    FlowOpsUser,
    FlowOpsWorkspace,
    FlowOpsWorkspaceMember
} from '../entities'
import { FlowOpsAuthService, FlowOpsLoggedInUser, createSelfAuthTokens, verifySelfAccessToken, verifySelfRefreshToken } from './service'

// 仅替换 sendSelfMail(不真发信);保留真实 isSelfSmtpConfigured(按 env 判断)
const mockSendSelfMail = jest.fn((..._args: unknown[]) => Promise.resolve())
jest.mock('../email/mailer', () => {
    const actual = jest.requireActual('../email/mailer') as Record<string, unknown>
    return { __esModule: true, ...actual, sendSelfMail: (...args: unknown[]) => mockSendSelfMail(...args) }
})

const anonymousRequestContext = {
    actorUserId: null,
    actorEmail: null,
    ip: '203.0.113.8',
    userAgent: 'FlowOps auth test'
}

const withAuditContext = <T extends { id: string; email: string }>(actor: T) => ({
    ...actor,
    actorUserId: actor.id,
    actorEmail: actor.email,
    ip: anonymousRequestContext.ip,
    userAgent: anonymousRequestContext.userAgent
})

const registerAccount = (
    service: FlowOpsAuthService,
    body: Parameters<FlowOpsAuthService['registerAccount']>[0],
    context = anonymousRequestContext
) => service['registerAccount'](body, context)

const inviteAccount = (
    service: FlowOpsAuthService,
    body: Parameters<FlowOpsAuthService['inviteAccount']>[0],
    actor: FlowOpsLoggedInUser | ReturnType<typeof withAuditContext<FlowOpsLoggedInUser>>
) => service['inviteAccount'](body, 'actorUserId' in actor ? actor : withAuditContext(actor))

const loginAccount = (service: FlowOpsAuthService, body: Parameters<FlowOpsAuthService['login']>[0], context = anonymousRequestContext) =>
    service['login'](body, context)

const resetPasswordAccount = (
    service: FlowOpsAuthService,
    body: Parameters<FlowOpsAuthService['resetPassword']>[0],
    context = anonymousRequestContext
) => service['resetPassword'](body, context)

const logoutAccount = (service: FlowOpsAuthService, userId: string | undefined, context = anonymousRequestContext) =>
    service['logout'](userId, context)

const makeInMemoryDataSource = (): DataSource => {
    const tables = new Map<unknown, any[]>()
    const counters = new Map<unknown, number>()

    const matches = (record: Record<string, unknown>, criteria: Record<string, unknown>) =>
        Object.entries(criteria).every(([key, value]) => record[key] === value)

    const getTable = (entity: unknown) => {
        if (!tables.has(entity)) tables.set(entity, [])
        return tables.get(entity)!
    }

    const saveRecord = async (entity: unknown, value: any): Promise<any> => {
        if (Array.isArray(value)) {
            const saved = []
            for (const item of value) saved.push(await saveRecord(entity, item))
            return saved
        }

        const table = getTable(entity)
        const nextValue = { ...value }
        if (!nextValue.id) {
            const nextId = (counters.get(entity) ?? 0) + 1
            counters.set(entity, nextId)
            nextValue.id = `${(entity as { name?: string }).name ?? 'entity'}-${nextId}`
        }
        const existingIndex = table.findIndex((record) => record.id === nextValue.id)
        if (existingIndex >= 0) {
            table[existingIndex] = { ...table[existingIndex], ...nextValue }
            return table[existingIndex]
        }
        table.push(nextValue)
        return nextValue
    }

    const makeRepo = (entity: unknown) => ({
        count: jest.fn(async () => getTable(entity).length),
        create: jest.fn((value: unknown = {}) => ({ ...(value as object) })),
        find: jest.fn(async () => [...getTable(entity)]),
        findOneBy: jest.fn(
            async (criteria: Record<string, unknown>) => getTable(entity).find((record) => matches(record, criteria)) ?? null
        ),
        findBy: jest.fn(async (criteria: Record<string, unknown>) => getTable(entity).filter((record) => matches(record, criteria))),
        save: jest.fn((value: any) => saveRecord(entity, value))
    })

    const repositoryCache = new Map<unknown, ReturnType<typeof makeRepo>>()
    const getRepository = jest.fn((entity: unknown) => {
        if (!repositoryCache.has(entity)) repositoryCache.set(entity, makeRepo(entity))
        return repositoryCache.get(entity)!
    })

    return {
        getRepository,
        transaction: jest.fn(async (callback: (manager: { getRepository: typeof getRepository }) => Promise<unknown>) =>
            callback({ getRepository })
        )
    } as any as DataSource
}

const seedRoles = async (dataSource: DataSource) => {
    await dataSource.getRepository(FlowOpsRole).save([
        {
            id: '00000000-0000-4000-8000-000000000001',
            name: 'owner',
            description: 'Owner',
            permissions: JSON.stringify(['*']),
            isBuiltin: true
        },
        {
            id: '00000000-0000-4000-8000-000000000002',
            name: 'admin',
            description: 'Admin',
            permissions: JSON.stringify(['users:invite']),
            isBuiltin: true
        },
        {
            id: '00000000-0000-4000-8000-000000000003',
            name: 'member',
            description: 'Member',
            permissions: JSON.stringify([])
        }
    ])
}

describe('FlowOpsAuthService', () => {
    let dataSource: DataSource
    let service: FlowOpsAuthService

    beforeEach(async () => {
        process.env.JWT_AUTH_TOKEN_SECRET = 'test-access-secret'
        process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret'
        process.env.JWT_TOKEN_EXPIRY_IN_MINUTES = '15'
        process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES = '60'
        process.env.APP_URL = 'http://localhost:3000'
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'

        dataSource = makeInMemoryDataSource()
        await seedRoles(dataSource)
        service = new FlowOpsAuthService(dataSource)
    })

    afterEach(async () => {
        delete process.env.JWT_AUTH_TOKEN_SECRET
        delete process.env.JWT_REFRESH_TOKEN_SECRET
        delete process.env.JWT_TOKEN_EXPIRY_IN_MINUTES
        delete process.env.JWT_REFRESH_TOKEN_EXPIRY_IN_MINUTES
        delete process.env.APP_URL
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
    })

    it('reports whether the self track is ready for first admin bootstrap', async () => {
        await expect(service.isFirstAdminSetup()).resolves.toBe(true)

        await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(service.isFirstAdminSetup()).resolves.toBe(false)
    })

    it('registers the first user as owner and creates the default organization and workspace', async () => {
        const loggedInUser = await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        expect(loggedInUser.email).toBe('ada@example.com')
        expect(loggedInUser.isOrganizationAdmin).toBe(true)
        expect(loggedInUser.activeOrganizationId).toBeTruthy()
        expect(loggedInUser.activeWorkspaceId).toBeTruthy()
        expect(loggedInUser.assignedWorkspaces).toEqual([
            expect.objectContaining({
                id: loggedInUser.activeWorkspaceId,
                name: 'Default Workspace',
                role: 'owner'
            })
        ])

        await expect(dataSource.getRepository(FlowOpsOrganization).count()).resolves.toBe(1)
        await expect(dataSource.getRepository(FlowOpsWorkspace).count()).resolves.toBe(1)
        await expect(dataSource.getRepository(FlowOpsWorkspaceMember).count()).resolves.toBe(1)
    })

    it('rejects the second registration without an invite token', async () => {
        await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(
            registerAccount(service, {
                user: {
                    name: 'Grace Hopper',
                    email: 'grace@example.com',
                    credential: 'Password1!'
                }
            })
        ).rejects.toMatchObject({
            statusCode: 403,
            message: 'Invite token is required'
        })
    })

    it('allows owner invite registration and assigns the invited workspace role', async () => {
        const owner = await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        const invite = await inviteAccount(
            service,
            {
                email: 'grace@example.com',
                name: 'Grace Hopper',
                roleName: 'member',
                workspaceId: owner.activeWorkspaceId
            },
            owner
        )

        expect(invite.inviteLink).toContain(invite.tempToken)

        const invitedUser = await registerAccount(service, {
            user: {
                name: 'Grace Hopper',
                email: 'grace@example.com',
                credential: 'Password1!',
                tempToken: invite.tempToken
            }
        })

        expect(invitedUser.email).toBe('grace@example.com')
        expect(invitedUser.isOrganizationAdmin).toBe(false)
        expect(invitedUser.assignedWorkspaces).toEqual([
            expect.objectContaining({
                id: owner.activeWorkspaceId,
                role: 'member'
            })
        ])
    })

    it('keeps first admin registration available in free tier and blocks the second organization user invite', async () => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL

        const owner = await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(
            inviteAccount(
                service,
                {
                    email: 'grace@example.com',
                    name: 'Grace Hopper',
                    roleName: 'member',
                    workspaceId: owner.activeWorkspaceId
                },
                owner
            )
        ).rejects.toMatchObject({
            statusCode: 402,
            message: '座位已满,需扩容授权'
        })
    })

    it('rechecks seats when an invited user activates from an existing invite token', async () => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL

        const owner = await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })
        const invited = await dataSource.getRepository(FlowOpsUser).save({
            email: 'grace@example.com',
            name: 'Grace Hopper',
            status: 'invited',
            tempToken: 'invite-token',
            tokenExpiry: new Date(Date.now() + 60_000)
        })
        const memberRole = await dataSource.getRepository(FlowOpsRole).findOneBy({ name: 'member' })
        await dataSource.getRepository(FlowOpsWorkspaceMember).save({
            workspaceId: owner.activeWorkspaceId,
            userId: invited.id,
            roleId: memberRole!.id
        })

        await expect(
            registerAccount(service, {
                user: {
                    name: 'Grace Hopper',
                    email: 'grace@example.com',
                    credential: 'Password1!',
                    tempToken: 'invite-token'
                }
            })
        ).rejects.toMatchObject({
            statusCode: 402,
            message: '座位已满,需扩容授权'
        })
    })

    it('logs in with the right password and rejects the wrong password', async () => {
        await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(loginAccount(service, { email: 'ada@example.com', password: 'wrong' })).rejects.toMatchObject({
            statusCode: 401,
            message: 'Incorrect Email or Password'
        })

        const loggedInUser = await loginAccount(service, { email: 'ada@example.com', password: 'Password1!' })

        expect(loggedInUser.email).toBe('ada@example.com')
        expect(loggedInUser.activeWorkspaceId).toBeTruthy()
        await expect(dataSource.getRepository(FlowOpsLoginActivity).count()).resolves.toBe(0)
    })

    it('creates and verifies access and refresh JWTs for the self track', async () => {
        const loggedInUser = await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        const tokens = createSelfAuthTokens(loggedInUser)

        expect(verifySelfAccessToken(tokens.accessToken)).toEqual(
            expect.objectContaining({
                sub: loggedInUser.id,
                activeWorkspaceId: loggedInUser.activeWorkspaceId,
                tokenType: 'access'
            })
        )
        expect(verifySelfRefreshToken(tokens.refreshToken)).toEqual(
            expect.objectContaining({
                sub: loggedInUser.id,
                activeWorkspaceId: loggedInUser.activeWorkspaceId,
                tokenType: 'refresh'
            })
        )
    })

    it('runs the forgot and reset password flow', async () => {
        await registerAccount(service, {
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        const forgot = await service.forgotPassword({
            user: {
                email: 'ada@example.com'
            }
        })
        expect(forgot.resetLink).toContain(forgot.tempToken)

        await resetPasswordAccount(service, {
            user: {
                email: 'ada@example.com',
                tempToken: forgot.tempToken,
                password: 'NewPassword1!'
            }
        })

        await expect(loginAccount(service, { email: 'ada@example.com', password: 'Password1!' })).rejects.toMatchObject({
            statusCode: 401
        })
        await expect(loginAccount(service, { email: 'ada@example.com', password: 'NewPassword1!' })).resolves.toEqual(
            expect.objectContaining({ email: 'ada@example.com' })
        )
    })

    it('audits registration and invitation after successful transactions without sensitive tokens', async () => {
        const owner = await registerAccount(
            service,
            { user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' } },
            anonymousRequestContext
        )
        const invite = await inviteAccount(
            service,
            { email: 'grace@example.com', name: 'Grace Hopper', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            withAuditContext(owner)
        )
        const member = await registerAccount(
            service,
            {
                user: {
                    name: 'Grace Hopper',
                    email: 'grace@example.com',
                    credential: 'Password1!',
                    tempToken: invite.tempToken
                }
            },
            anonymousRequestContext
        )

        const rows = await dataSource.getRepository(FlowOpsAuditLog).findBy({ status: 'success' })
        expect(rows.map((row) => row.action)).toEqual(['auth.register', 'user.invite', 'auth.register'])
        expect(rows).toEqual(
            expect.arrayContaining([
                expect.objectContaining({
                    action: 'auth.register',
                    actorUserId: owner.id,
                    actorEmail: owner.email,
                    targetId: owner.id,
                    targetName: owner.email,
                    organizationId: owner.activeOrganizationId,
                    workspaceId: owner.activeWorkspaceId,
                    ip: anonymousRequestContext.ip,
                    userAgent: anonymousRequestContext.userAgent
                }),
                expect.objectContaining({
                    action: 'user.invite',
                    actorUserId: owner.id,
                    targetId: member.id,
                    targetName: member.email,
                    organizationId: owner.activeOrganizationId,
                    workspaceId: owner.activeWorkspaceId
                })
            ])
        )
        const serialized = rows.map((row) => row.metadata).join(' ')
        expect(serialized).not.toContain('Password1!')
        expect(serialized).not.toContain(invite.tempToken)
        expect(serialized).not.toContain('inviteLink')
    })

    it('maps every login outcome to semantic audit actions and keeps the legacy table unwritten', async () => {
        const owner = await registerAccount(
            service,
            { user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' } },
            anonymousRequestContext
        )
        const ownerEntity = await dataSource.getRepository(FlowOpsUser).findOneBy({ id: owner.id })
        await dataSource.getRepository(FlowOpsUser).save({
            id: 'disabled-user',
            email: 'disabled@example.com',
            name: 'Disabled',
            credential: ownerEntity!.credential,
            status: 'disabled'
        })
        await dataSource.getRepository(FlowOpsUser).save({
            id: 'unassigned-user',
            email: 'unassigned@example.com',
            name: 'Unassigned',
            credential: ownerEntity!.credential,
            status: 'active'
        })

        await expect(
            loginAccount(service, { email: 'unknown@example.com', password: 'Password1!' }, anonymousRequestContext)
        ).rejects.toMatchObject({
            statusCode: 401
        })
        await expect(loginAccount(service, { email: owner.email, password: 'wrong' }, anonymousRequestContext)).rejects.toMatchObject({
            statusCode: 401
        })
        await expect(
            loginAccount(service, { email: 'disabled@example.com', password: 'Password1!' }, anonymousRequestContext)
        ).rejects.toMatchObject({ statusCode: 401 })
        await expect(
            loginAccount(service, { email: 'unassigned@example.com', password: 'Password1!' }, anonymousRequestContext)
        ).rejects.toMatchObject({ statusCode: 401 })
        await expect(loginAccount(service, { email: owner.email, password: 'Password1!' }, anonymousRequestContext)).resolves.toMatchObject(
            { id: owner.id }
        )

        const rows = await dataSource.getRepository(FlowOpsAuditLog).findBy({ targetType: 'user' })
        const loginRows = rows.filter((row) => row.action === 'auth.login' || row.action === 'auth.loginFailed')
        expect(loginRows.map((row) => [row.action, row.status, JSON.parse(row.metadata).reason ?? null])).toEqual([
            ['auth.loginFailed', 'failure', 'UNKNOWN_USER'],
            ['auth.loginFailed', 'failure', 'INVALID_CREDENTIAL'],
            ['auth.loginFailed', 'failure', 'USER_DISABLED'],
            ['auth.loginFailed', 'failure', 'NO_ASSIGNED_WORKSPACE'],
            ['auth.login', 'success', null]
        ])
        expect(loginRows[0]).toEqual(
            expect.objectContaining({
                actorUserId: null,
                targetId: null,
                targetName: 'unknown@example.com',
                ip: anonymousRequestContext.ip,
                userAgent: anonymousRequestContext.userAgent
            })
        )
        await expect(dataSource.getRepository(FlowOpsLoginActivity).count()).resolves.toBe(0)
    })

    it('audits logout and password reset success/failure without exposing reset credentials', async () => {
        const owner = await registerAccount(
            service,
            { user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' } },
            anonymousRequestContext
        )
        const forgot = await service.forgotPassword({ user: { email: owner.email } })
        await resetPasswordAccount(
            service,
            { user: { email: owner.email, tempToken: forgot.tempToken, password: 'NewPassword1!' } },
            anonymousRequestContext
        )
        await expect(
            resetPasswordAccount(
                service,
                { user: { email: owner.email, tempToken: 'invalid-token', password: 'AnotherPassword1!' } },
                anonymousRequestContext
            )
        ).rejects.toMatchObject({ statusCode: 403, message: 'Invalid reset token' })
        await logoutAccount(service, owner.id, anonymousRequestContext)

        const rows = await dataSource.getRepository(FlowOpsAuditLog).findBy({ targetId: owner.id })
        expect(rows.filter((row) => row.action === 'auth.passwordReset' || row.action === 'auth.logout')).toEqual([
            expect.objectContaining({ action: 'auth.passwordReset', status: 'success', actorUserId: owner.id, targetName: owner.email }),
            expect.objectContaining({ action: 'auth.logout', status: 'success', actorUserId: owner.id, targetName: owner.email })
        ])
        const resetFailure = (await dataSource.getRepository(FlowOpsAuditLog).findBy({ action: 'auth.passwordReset' })).find(
            (row) => row.status === 'failure'
        )
        expect(resetFailure).toEqual(
            expect.objectContaining({ actorUserId: null, targetId: null, targetName: owner.email, status: 'failure' })
        )
        expect(JSON.parse(resetFailure!.metadata)).toEqual({ reason: 'INVALID_OR_EXPIRED_TOKEN' })
        const serialized = (await dataSource.getRepository(FlowOpsAuditLog).find()).map((row) => row.metadata).join(' ')
        expect(serialized).not.toContain('NewPassword1!')
        expect(serialized).not.toContain('AnotherPassword1!')
        expect(serialized).not.toContain('invalid-token')
        expect(serialized).not.toContain(forgot.tempToken)
    })

    it('keeps registration successful when audit persistence fails', async () => {
        dataSource.getRepository(FlowOpsAuditLog).save = jest.fn(() => Promise.reject(new Error('audit unavailable'))) as any

        const owner = await registerAccount(
            service,
            { user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' } },
            anonymousRequestContext
        )

        expect(owner).toEqual(expect.objectContaining({ email: 'ada@example.com', role: 'owner' }))
        await expect(dataSource.getRepository(FlowOpsUser).count()).resolves.toBe(1)
    })
})

describe('FlowOpsAuthService 邮件发送(配置 SMTP 时)', () => {
    const savedEnv = { ...process.env }
    let dataSource: DataSource
    let service: FlowOpsAuthService

    beforeEach(async () => {
        dataSource = makeInMemoryDataSource()
        service = new FlowOpsAuthService(dataSource)
        await seedRoles(dataSource)
        mockSendSelfMail.mockReset()
        process.env.SMTP_HOST = 'smtp.example.com'
        process.env.SMTP_PORT = '465'
        process.env.SMTP_USER = 'noreply@example.com'
        process.env.SMTP_PASSWORD = 'app-secret'
        process.env.SENDER_EMAIL = 'noreply@example.com'
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
    })

    afterEach(() => {
        process.env = { ...savedEnv }
    })

    it('邀请:配置 SMTP 后发邀请邮件,emailSent=true(仍返回 inviteLink)', async () => {
        const owner = await registerAccount(service, {
            user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' }
        })

        const invite = await inviteAccount(
            service,
            { email: 'grace@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            owner
        )

        expect(invite.emailSent).toBe(true)
        expect(mockSendSelfMail).toHaveBeenCalledTimes(1)
        expect(invite.inviteLink).toContain(invite.tempToken)
    })

    it('找回密码:配置 SMTP 后发重置邮件,emailSent=true 且不回传 resetLink', async () => {
        await registerAccount(service, {
            user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' }
        })

        const forgot = await service.forgotPassword({ user: { email: 'ada@example.com' } })

        expect(forgot.emailSent).toBe(true)
        expect(forgot.resetLink).toBeUndefined()
        expect(mockSendSelfMail).toHaveBeenCalledTimes(1)
    })

    it('未知邮箱找回:不发邮件,emailSent=false', async () => {
        await registerAccount(service, {
            user: { name: 'Ada Lovelace', email: 'ada@example.com', credential: 'Password1!' }
        })

        const forgot = await service.forgotPassword({ user: { email: 'nobody@example.com' } })

        expect(forgot.emailSent).toBe(false)
        expect(mockSendSelfMail).not.toHaveBeenCalled()
    })
})
