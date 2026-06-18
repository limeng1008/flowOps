import express from 'express'
import { NextFunction, Response } from 'express'
import request from 'supertest'
import type { DataSource } from 'typeorm'
import { FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { FlowOpsLoggedInUser } from '../auth/types'
import { BUILTIN_SELF_ROLE_PERMISSIONS } from '../rbac/permissions'
import { checkPermission } from '../middleware'
import { FlowOpsAdminService } from './service'

const entities = [FlowOpsUser, FlowOpsOrganization, FlowOpsWorkspace, FlowOpsWorkspaceMember, FlowOpsRole]

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
        countBy: jest.fn(
            async (criteria: Record<string, unknown>) => getTable(entity).filter((record) => matches(record, criteria)).length
        ),
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
        if (!entities.includes(entity as any)) throw new Error(`Unexpected entity ${(entity as { name?: string }).name}`)
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
            permissions: JSON.stringify(BUILTIN_SELF_ROLE_PERMISSIONS.owner),
            isBuiltin: true
        },
        {
            id: '00000000-0000-4000-8000-000000000002',
            name: 'admin',
            description: 'Admin',
            permissions: JSON.stringify(BUILTIN_SELF_ROLE_PERMISSIONS.admin),
            isBuiltin: true
        },
        {
            id: '00000000-0000-4000-8000-000000000003',
            name: 'member',
            description: 'Member',
            permissions: JSON.stringify(BUILTIN_SELF_ROLE_PERMISSIONS.member),
            isBuiltin: true
        }
    ])
}

const buildApp = (dataSource: DataSource, users: Record<string, FlowOpsLoggedInUser>) => {
    const app = express()
    const service = () => new FlowOpsAdminService(dataSource)
    const sendError = (error: unknown, res: Response, next: NextFunction) => {
        if (error && typeof error === 'object' && 'statusCode' in error) {
            return res.status(Number((error as any).statusCode)).json({ message: (error as any).message })
        }
        next(error)
    }
    const passwordOnlyLoginMethods = () => ({
        providers: [],
        callbacks: [],
        passwordLoginEnabled: true
    })

    app.use(express.json())
    app.use((req, _res, next) => {
        const key = req.header('x-test-user')
        if (key && users[key]) req.user = users[key] as any
        next()
    })
    app.get('/organization', checkPermission('users:manage'), async (req, res, next) => {
        try {
            res.json(await service().listOrganizations((req as any).user as FlowOpsLoggedInUser))
        } catch (error) {
            sendError(error, res, next)
        }
    })
    app.get('/loginmethod/default', (_req, res) => res.json(passwordOnlyLoginMethods()))
    app.get('/loginmethod', checkPermission('sso:manage'), (_req, res) => res.json(passwordOnlyLoginMethods()))
    return app
}

describe('self IAM platform routes', () => {
    let dataSource: DataSource
    let owner: FlowOpsLoggedInUser
    let member: FlowOpsLoggedInUser
    let app: express.Application

    beforeEach(async () => {
        process.env.JWT_AUTH_TOKEN_SECRET = 'test-access-secret'
        process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret'
        dataSource = makeInMemoryDataSource()
        await seedRoles(dataSource)

        const ownerRole = await dataSource.getRepository(FlowOpsRole).findOneBy({ name: 'owner' })
        const memberRole = await dataSource.getRepository(FlowOpsRole).findOneBy({ name: 'member' })
        await dataSource.getRepository(FlowOpsUser).save([
            { id: 'owner-user', name: 'Owner', email: 'owner@example.com', status: 'active' },
            { id: 'member-user', name: 'Member', email: 'member@example.com', status: 'active' }
        ])
        await dataSource.getRepository(FlowOpsOrganization).save({
            id: 'organization-1',
            name: 'FlowOps Organization',
            ownerUserId: 'owner-user'
        })
        await dataSource.getRepository(FlowOpsWorkspace).save({
            id: 'workspace-1',
            name: 'Default Workspace',
            organizationId: 'organization-1'
        })
        await dataSource.getRepository(FlowOpsWorkspaceMember).save([
            { id: 'owner-member', userId: 'owner-user', workspaceId: 'workspace-1', roleId: ownerRole!.id },
            { id: 'member-member', userId: 'member-user', workspaceId: 'workspace-1', roleId: memberRole!.id }
        ])

        owner = {
            id: 'owner-user',
            name: 'Owner',
            email: 'owner@example.com',
            status: 'active',
            role: 'owner',
            isSSO: false,
            activeOrganizationId: 'organization-1',
            activeOrganizationSubscriptionId: '',
            activeOrganizationCustomerId: '',
            activeOrganizationProductId: '',
            activeWorkspaceId: 'workspace-1',
            activeWorkspace: 'Default Workspace',
            isOrganizationAdmin: true,
            assignedWorkspaces: [
                { id: 'workspace-1', name: 'Default Workspace', roleId: ownerRole!.id, role: 'owner', organizationId: 'organization-1' }
            ],
            permissions: BUILTIN_SELF_ROLE_PERMISSIONS.owner,
            features: {}
        }
        member = {
            id: 'member-user',
            name: 'Member',
            email: 'member@example.com',
            status: 'active',
            role: 'member',
            isSSO: false,
            activeOrganizationId: 'organization-1',
            activeOrganizationSubscriptionId: '',
            activeOrganizationCustomerId: '',
            activeOrganizationProductId: '',
            activeWorkspaceId: 'workspace-1',
            activeWorkspace: 'Default Workspace',
            isOrganizationAdmin: false,
            assignedWorkspaces: [
                { id: 'workspace-1', name: 'Default Workspace', roleId: memberRole!.id, role: 'member', organizationId: 'organization-1' }
            ],
            permissions: BUILTIN_SELF_ROLE_PERMISSIONS.member,
            features: {}
        }

        app = buildApp(dataSource, { owner, member })
    })

    afterEach(() => {
        delete process.env.JWT_AUTH_TOKEN_SECRET
        delete process.env.JWT_REFRESH_TOKEN_SECRET
    })

    it('serves the single organization view to authorized users and rejects members', async () => {
        const ok = await request(app).get('/organization').set('x-test-user', 'owner')

        expect(ok.status).toBe(200)
        expect(ok.body).toEqual([
            expect.objectContaining({
                id: owner.activeOrganizationId,
                name: 'FlowOps Organization',
                ownerUserId: owner.id,
                subscriptionId: null,
                customerId: null
            })
        ])

        const forbidden = await request(app).get('/organization').set('x-test-user', 'member')
        expect(forbidden.status).toBe(403)
    })

    it('keeps password login public while protecting SSO login method administration', async () => {
        const defaults = await request(app).get('/loginmethod/default')
        expect(defaults.status).toBe(200)
        expect(defaults.body).toEqual({
            providers: [],
            callbacks: [],
            passwordLoginEnabled: true
        })

        const ok = await request(app).get('/loginmethod').set('x-test-user', 'owner').query({
            organizationId: owner.activeOrganizationId
        })
        expect(ok.status).toBe(200)
        expect(ok.body).toMatchObject({
            providers: [],
            callbacks: [],
            passwordLoginEnabled: true
        })

        const forbidden = await request(app).get('/loginmethod').set('x-test-user', 'member').query({
            organizationId: owner.activeOrganizationId
        })
        expect(forbidden.status).toBe(403)
    })
})
