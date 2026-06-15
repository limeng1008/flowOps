import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import type { DataSource } from 'typeorm'
import { FlowOpsLoginActivity, FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { FlowOpsAuthService, createSelfAuthTokens, verifySelfAccessToken, verifySelfRefreshToken } from './service'

const entities = [FlowOpsUser, FlowOpsOrganization, FlowOpsWorkspace, FlowOpsWorkspaceMember, FlowOpsRole, FlowOpsLoginActivity]

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
    })

    it('reports whether the self track is ready for first admin bootstrap', async () => {
        await expect(service.isFirstAdminSetup()).resolves.toBe(true)

        await service.registerAccount({
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(service.isFirstAdminSetup()).resolves.toBe(false)
    })

    it('registers the first user as owner and creates the default organization and workspace', async () => {
        const loggedInUser = await service.registerAccount({
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
        await service.registerAccount({
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(
            service.registerAccount({
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
        const owner = await service.registerAccount({
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        const invite = await service.inviteAccount(
            {
                email: 'grace@example.com',
                name: 'Grace Hopper',
                roleName: 'member',
                workspaceId: owner.activeWorkspaceId
            },
            owner
        )

        expect(invite.inviteLink).toContain(invite.tempToken)

        const invitedUser = await service.registerAccount({
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

    it('logs in with the right password and rejects the wrong password', async () => {
        await service.registerAccount({
            user: {
                name: 'Ada Lovelace',
                email: 'ada@example.com',
                credential: 'Password1!'
            }
        })

        await expect(service.login({ email: 'ada@example.com', password: 'wrong' })).rejects.toMatchObject({
            statusCode: 401,
            message: 'Incorrect Email or Password'
        })

        const loggedInUser = await service.login({ email: 'ada@example.com', password: 'Password1!' })

        expect(loggedInUser.email).toBe('ada@example.com')
        expect(loggedInUser.activeWorkspaceId).toBeTruthy()
        await expect(dataSource.getRepository(FlowOpsLoginActivity).count()).resolves.toBe(2)
    })

    it('creates and verifies access and refresh JWTs for the self track', async () => {
        const loggedInUser = await service.registerAccount({
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
        await service.registerAccount({
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

        await service.resetPassword({
            user: {
                email: 'ada@example.com',
                tempToken: forgot.tempToken,
                password: 'NewPassword1!'
            }
        })

        await expect(service.login({ email: 'ada@example.com', password: 'Password1!' })).rejects.toMatchObject({
            statusCode: 401
        })
        await expect(service.login({ email: 'ada@example.com', password: 'NewPassword1!' })).resolves.toEqual(
            expect.objectContaining({ email: 'ada@example.com' })
        )
    })
})
