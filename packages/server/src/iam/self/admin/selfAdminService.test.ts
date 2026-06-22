import { describe, expect, it, beforeEach, afterEach } from '@jest/globals'
import type { DataSource } from 'typeorm'
import { ChatFlow } from '../../../database/entities/ChatFlow'
import {
    FlowOpsAuditLog,
    FlowOpsLoginActivity,
    FlowOpsOrganization,
    FlowOpsRole,
    FlowOpsUser,
    FlowOpsWorkspace,
    FlowOpsWorkspaceMember
} from '../entities'
import { FlowOpsAuthService } from '../auth/service'
import { FlowOpsLoggedInUser } from '../auth/types'
import { FlowOpsAuthenticatedAuditActor } from '../audit/context'
import { FlowOpsAdminService } from './service'
import { ALL_SELF_PERMISSIONS, BUILTIN_SELF_ROLE_PERMISSIONS, MEMBER_SELF_PERMISSIONS } from '../rbac/permissions'
import { getWorkspaceSearchOptions } from '../workspace/query'

const entities = [
    FlowOpsUser,
    FlowOpsOrganization,
    FlowOpsWorkspace,
    FlowOpsWorkspaceMember,
    FlowOpsRole,
    FlowOpsLoginActivity,
    FlowOpsAuditLog,
    ChatFlow
]

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

    const removeRecords = (entity: unknown, criteria: Record<string, unknown>) => {
        const table = getTable(entity)
        const before = table.length
        const remaining = table.filter((record) => !matches(record, criteria))
        tables.set(entity, remaining)
        return before - remaining.length
    }

    const updateRecords = (entity: unknown, criteria: Record<string, unknown>, partial: Record<string, unknown>) => {
        const table = getTable(entity)
        let affected = 0
        for (const record of table) {
            if (matches(record, criteria)) {
                Object.assign(record, partial)
                affected += 1
            }
        }
        return affected
    }

    const makeRepo = (entity: unknown) => ({
        count: jest.fn(async () => getTable(entity).length),
        countBy: jest.fn(
            async (criteria: Record<string, unknown>) => getTable(entity).filter((record) => matches(record, criteria)).length
        ),
        create: jest.fn((value: unknown = {}) => ({ ...(value as object) })),
        find: jest.fn(async (options?: { where?: Record<string, unknown> }) => {
            const records = [...getTable(entity)]
            return options?.where ? records.filter((record) => matches(record, options.where!)) : records
        }),
        findOne: jest.fn(
            async (options: { where: Record<string, unknown> }) => getTable(entity).find((record) => matches(record, options.where)) ?? null
        ),
        findOneBy: jest.fn(
            async (criteria: Record<string, unknown>) => getTable(entity).find((record) => matches(record, criteria)) ?? null
        ),
        findBy: jest.fn(async (criteria: Record<string, unknown>) => getTable(entity).filter((record) => matches(record, criteria))),
        save: jest.fn((value: any) => saveRecord(entity, value)),
        delete: jest.fn(async (criteria: Record<string, unknown>) => ({ affected: removeRecords(entity, criteria) })),
        update: jest.fn(async (criteria: Record<string, unknown>, partial: Record<string, unknown>) => ({
            affected: updateRecords(entity, criteria, partial)
        }))
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

describe('FlowOpsAdminService', () => {
    let dataSource: DataSource
    let authService: FlowOpsAuthService
    let adminService: FlowOpsAdminService

    const requestContext = {
        actorUserId: 'owner-user',
        actorEmail: 'owner@example.com',
        ip: '10.0.0.8',
        userAgent: 'FlowOps admin test'
    }

    const withAuditContext = <T extends FlowOpsLoggedInUser>(actor: T): FlowOpsAuthenticatedAuditActor => ({
        ...actor,
        actorUserId: actor.id,
        actorEmail: actor.email,
        ip: requestContext.ip,
        userAgent: requestContext.userAgent
    })

    const defaultActor: FlowOpsAuthenticatedAuditActor = withAuditContext({
        id: requestContext.actorUserId,
        email: requestContext.actorEmail,
        name: 'Owner',
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
        assignedWorkspaces: [],
        permissions: ['*'],
        features: {},
        tier: 'enterprise'
    })

    const auditActor = (actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor): FlowOpsAuthenticatedAuditActor =>
        'actorUserId' in actor ? actor : withAuditContext(actor)

    const registerAccount = (body: Parameters<FlowOpsAuthService['registerAccount']>[0], context = requestContext) =>
        authService['registerAccount'](body, context)
    const inviteAccount = (
        body: Parameters<FlowOpsAuthService['inviteAccount']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor
    ) => authService['inviteAccount'](body, auditActor(actor))
    const createRole = (
        body: Parameters<FlowOpsAdminService['createRole']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['createRole'](body, auditActor(actor))
    const updateRole = (
        body: Parameters<FlowOpsAdminService['updateRole']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['updateRole'](body, auditActor(actor))
    const deleteRole = (id: string, actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor) =>
        adminService['deleteRole'](id, auditActor(actor))
    const createWorkspace = (
        body: Parameters<FlowOpsAdminService['createWorkspace']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['createWorkspace'](body, auditActor(actor))
    const updateWorkspace = (
        body: Parameters<FlowOpsAdminService['updateWorkspace']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['updateWorkspace'](body, auditActor(actor))
    const deleteWorkspace = (id: string, actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor) =>
        adminService['deleteWorkspace'](id, auditActor(actor))
    const updateWorkspaceUserRole = (
        body: Parameters<FlowOpsAdminService['updateWorkspaceUserRole']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['updateWorkspaceUserRole'](body, auditActor(actor))
    const deleteWorkspaceUser = (
        workspaceId: string,
        userId: string,
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['deleteWorkspaceUser'](workspaceId, userId, auditActor(actor))
    const updateOrganizationUser = (
        body: Parameters<FlowOpsAdminService['updateOrganizationUser']>[0],
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['updateOrganizationUser'](body, auditActor(actor))
    const deleteOrganizationUser = (
        organizationId: string,
        userId: string,
        actor: FlowOpsLoggedInUser | FlowOpsAuthenticatedAuditActor = defaultActor
    ) => adminService['deleteOrganizationUser'](organizationId, userId, auditActor(actor))

    const auditRows = async () => {
        const rows = await dataSource.getRepository(FlowOpsAuditLog).find()
        return rows.map((row) => ({ ...row, metadata: JSON.parse(row.metadata) }))
    }

    beforeEach(async () => {
        process.env.JWT_AUTH_TOKEN_SECRET = 'test-access-secret'
        process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret'
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        dataSource = makeInMemoryDataSource()
        await seedRoles(dataSource)
        authService = new FlowOpsAuthService(dataSource)
        adminService = new FlowOpsAdminService(dataSource)
    })

    afterEach(() => {
        delete process.env.JWT_AUTH_TOKEN_SECRET
        delete process.env.JWT_REFRESH_TOKEN_SECRET
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
    })

    it('returns builtin role permissions for owner, admin, and member sessions', async () => {
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        expect(owner.permissions).toEqual(ALL_SELF_PERMISSIONS)
        expect(owner.isOrganizationAdmin).toBe(true)

        const adminInvite = await inviteAccount(
            { email: 'admin@example.com', roleName: 'admin', workspaceId: owner.activeWorkspaceId },
            owner
        )
        const admin = await registerAccount({
            user: { name: 'Admin', email: 'admin@example.com', credential: 'Password1!', tempToken: adminInvite.tempToken }
        })
        expect(admin.role).toBe('admin')
        expect(admin.isOrganizationAdmin).toBe(false)
        expect(admin.permissions).toContain('users:manage')
        expect(admin.permissions).toContain('workspace:create')
        expect(admin.permissions).not.toContain('sso:manage')

        const memberInvite = await inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            owner
        )
        const member = await registerAccount({
            user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: memberInvite.tempToken }
        })
        expect(member.role).toBe('member')
        expect(member.permissions).toEqual(MEMBER_SELF_PERMISSIONS)
        expect(member.permissions).not.toContain('roles:manage')
    })

    it('protects builtin role names and supports custom role CRUD', async () => {
        const custom = await createRole({
            name: 'analyst',
            description: 'Can inspect chatflows',
            permissions: JSON.stringify(['chatflows:view'])
        })
        expect(custom.name).toBe('analyst')

        const roles = await adminService.listRoles()
        const ownerRole = roles.find((role) => role.name === 'owner')!

        await expect(updateRole({ id: ownerRole.id, name: 'renamed-owner' })).rejects.toMatchObject({
            statusCode: 400,
            message: 'Built-in role names cannot be changed'
        })
        await expect(deleteRole(ownerRole.id)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Built-in roles cannot be deleted'
        })

        const updated = await updateRole({ id: custom.id, name: 'analyst', permissions: JSON.stringify(['chatflows:view']) })
        expect(updated.permissions).toBe(JSON.stringify(['chatflows:view']))
        await expect(deleteRole(custom.id)).resolves.toMatchObject({ success: true })
    })

    it('switches workspaces, scopes workspace queries, and rejects unassigned workspaces', async () => {
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const defaultWorkspaceId = owner.activeWorkspaceId!
        const researchWorkspace = await createWorkspace(
            {
                name: 'Research',
                description: 'Private research workspace',
                organizationId: owner.activeOrganizationId,
                existingWorkspaceId: defaultWorkspaceId
            },
            owner
        )

        const switchedOwner = await adminService.switchWorkspace(researchWorkspace.id, owner)
        expect(switchedOwner.activeWorkspaceId).toBe(researchWorkspace.id)
        expect(switchedOwner.permissions).toEqual(ALL_SELF_PERMISSIONS)

        await dataSource.getRepository(ChatFlow).save([
            { id: 'chatflow-a', name: 'A flow', flowData: '{}', workspaceId: defaultWorkspaceId },
            { id: 'chatflow-b', name: 'B flow', flowData: '{}', workspaceId: researchWorkspace.id }
        ])
        await expect(dataSource.getRepository(ChatFlow).findBy(getWorkspaceSearchOptions(researchWorkspace.id))).resolves.toEqual([
            expect.objectContaining({ id: 'chatflow-b' })
        ])

        const memberInvite = await inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: defaultWorkspaceId },
            owner
        )
        const member = await registerAccount({
            user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: memberInvite.tempToken }
        })
        await expect(adminService.switchWorkspace(researchWorkspace.id, member)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Workspace is not assigned to user'
        })
    })

    it('lists organization users and updates workspace roles', async () => {
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const memberInvite = await inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            owner
        )
        const member = await registerAccount({
            user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: memberInvite.tempToken }
        })
        const adminRole = (await adminService.listRoles()).find((role) => role.name === 'admin')!

        const users = await adminService.listOrganizationUsers(owner.activeOrganizationId!)
        expect(users).toEqual(
            expect.arrayContaining([
                expect.objectContaining({ userId: owner.id, isOrgOwner: true, roleCount: 1 }),
                expect.objectContaining({ userId: member.id, isOrgOwner: false, roleCount: 1 })
            ])
        )

        await updateWorkspaceUserRole({
            userId: member.id,
            workspaceId: owner.activeWorkspaceId,
            roleId: adminRole.id
        })
        const promotedMember = await authService.getLoggedInUser(member.id, owner.activeWorkspaceId)
        expect(promotedMember.role).toBe('admin')

        // 护栏:member 当前只在一个工作区,删除其最后一个工作区应被拒
        await expect(deleteWorkspaceUser(owner.activeWorkspaceId!, member.id)).rejects.toMatchObject({
            statusCode: 400,
            message: "Cannot remove the user's last workspace"
        })

        // upsert:updateWorkspaceUserRole 对不存在的成员应「新增」(把 member 加入第二个工作区)
        const secondWorkspace = await createWorkspace({ name: 'Second', organizationId: owner.activeOrganizationId }, owner)
        const memberRole = (await adminService.listRoles()).find((role) => role.name === 'member')!
        await updateWorkspaceUserRole({ userId: member.id, workspaceId: secondWorkspace.id, roleId: memberRole.id })
        await expect(adminService.listWorkspacesByUserId(member.id)).resolves.toHaveLength(2)

        // 现在 member 有两个工作区,移除其中一个应成功
        await expect(deleteWorkspaceUser(owner.activeWorkspaceId!, member.id)).resolves.toMatchObject({ success: true })
        await expect(adminService.listWorkspaceUsers(owner.activeWorkspaceId!)).resolves.toHaveLength(1)
        await expect(adminService.listWorkspacesByUserId(member.id)).resolves.toHaveLength(1)

        // 护栏:组织 owner 不可被移出工作区
        await expect(deleteWorkspaceUser(owner.activeWorkspaceId!, owner.id)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Organization owner cannot be removed from a workspace'
        })
    })

    it('限制非 multi-workspace 档位每组织仅 1 个工作区(团队版及以上放开)', async () => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL // free 档
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        // 注册已建默认工作区(第 1 个);free 档再建第 2 个应被拒 + 提示升级
        await expect(createWorkspace({ name: 'Second', organizationId: owner.activeOrganizationId }, owner)).rejects.toMatchObject({
            statusCode: 403
        })

        // 切 enterprise(满血)后可建多个
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        const second = await createWorkspace({ name: 'Second', organizationId: owner.activeOrganizationId }, owner)
        expect(second.name).toBe('Second')
    })

    it('reports the real organization user usage and free tier seat limit', async () => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })

        await expect(adminService.getCurrentUsage(owner.activeOrganizationId)).resolves.toMatchObject({
            users: { usage: 1, limit: 1 }
        })
        await expect(adminService.getAdditionalSeatsQuantity(owner.activeOrganizationId)).resolves.toMatchObject({
            includedSeats: 1,
            quantity: 0,
            totalOrgUsers: 1
        })
    })

    it('blocks adding a new organization user above the free tier seat limit', async () => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const workspace = await dataSource.getRepository(FlowOpsWorkspace).save({
            name: 'Unassigned',
            organizationId: owner.activeOrganizationId
        })
        const memberRole = (await adminService.listRoles()).find((role) => role.name === 'member')!
        const externalUser = await dataSource.getRepository(FlowOpsUser).save({
            email: 'external@example.com',
            name: 'External',
            status: 'active'
        })

        await expect(
            updateWorkspaceUserRole({
                userId: externalUser.id,
                workspaceId: workspace.id,
                roleId: memberRole.id
            })
        ).rejects.toMatchObject({
            statusCode: 402,
            message: '座位已满,需扩容授权'
        })
    })

    it('allows an existing organization user to join another workspace without consuming another seat', async () => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const workspace = await dataSource.getRepository(FlowOpsWorkspace).save({
            name: 'Unassigned',
            organizationId: owner.activeOrganizationId
        })
        const ownerRole = (await adminService.listRoles()).find((role) => role.name === 'owner')!

        await expect(
            updateWorkspaceUserRole({
                userId: owner.id,
                workspaceId: workspace.id,
                roleId: ownerRole.id
            })
        ).resolves.toMatchObject({
            userId: owner.id,
            workspaceId: workspace.id,
            roleId: ownerRole.id
        })
        await expect(adminService.getCurrentUsage(owner.activeOrganizationId)).resolves.toMatchObject({
            users: { usage: 1, limit: 1 }
        })
    })

    it('treats local commercial deployments as unlimited seats', async () => {
        const owner = await registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const memberInvite = await inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            owner
        )
        await registerAccount({
            user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: memberInvite.tempToken }
        })

        await expect(adminService.getCurrentUsage(owner.activeOrganizationId)).resolves.toMatchObject({
            users: { usage: 2, limit: -1 }
        })
        await expect(adminService.getAdditionalSeatsQuantity(owner.activeOrganizationId)).resolves.toMatchObject({
            includedSeats: -1,
            quantity: 0,
            totalOrgUsers: 2
        })
    })

    it('audits role create, update, and delete with actor and before/after differences', async () => {
        const owner = withAuditContext(
            await registerAccount({ user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' } }, requestContext)
        )
        const created = await createRole({ name: 'analyst', description: 'Read flows', permissions: ['chatflows:view'] }, owner)
        await updateRole(
            { id: created.id, name: 'reviewer', description: 'Review flows', permissions: ['chatflows:view', 'chatflows:update'] },
            owner
        )
        await deleteRole(created.id, owner)

        expect((await auditRows()).filter((row) => row.action.startsWith('role.'))).toEqual([
            expect.objectContaining({
                action: 'role.create',
                actorUserId: owner.id,
                actorEmail: owner.email,
                targetId: created.id,
                targetName: 'analyst',
                organizationId: owner.activeOrganizationId,
                status: 'success',
                ip: requestContext.ip,
                userAgent: requestContext.userAgent,
                metadata: expect.objectContaining({ after: expect.objectContaining({ name: 'analyst' }) })
            }),
            expect.objectContaining({
                action: 'role.update',
                targetName: 'reviewer',
                metadata: expect.objectContaining({
                    before: expect.objectContaining({ name: 'analyst', permissions: ['chatflows:view'] }),
                    after: expect.objectContaining({ name: 'reviewer', permissions: ['chatflows:update', 'chatflows:view'] }),
                    permissionsAdded: ['chatflows:update'],
                    permissionsRemoved: []
                })
            }),
            expect.objectContaining({
                action: 'role.delete',
                targetName: 'reviewer',
                metadata: expect.objectContaining({ before: expect.objectContaining({ name: 'reviewer' }), after: null })
            })
        ])
    })

    it('audits workspace create, update, and delete from database-backed targets', async () => {
        const owner = withAuditContext(
            await registerAccount({ user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' } }, requestContext)
        )
        const workspace = await createWorkspace({ name: 'Research', description: 'Initial', organizationId: 'body-must-not-win' }, owner)
        await updateWorkspace({ id: workspace.id, name: 'Research Lab', description: 'Updated' }, owner)
        await deleteWorkspace(workspace.id, owner)

        const rows = (await auditRows()).filter((row) => row.action.startsWith('workspace.'))
        expect(rows).toEqual([
            expect.objectContaining({
                action: 'workspace.create',
                targetId: workspace.id,
                targetName: 'Research',
                organizationId: owner.activeOrganizationId,
                workspaceId: workspace.id
            }),
            expect.objectContaining({
                action: 'workspace.update',
                targetName: 'Research Lab',
                metadata: expect.objectContaining({
                    before: expect.objectContaining({ name: 'Research', description: 'Initial' }),
                    after: expect.objectContaining({ name: 'Research Lab', description: 'Updated' })
                })
            }),
            expect.objectContaining({
                action: 'workspace.delete',
                targetName: 'Research Lab',
                metadata: expect.objectContaining({ before: expect.objectContaining({ userCount: 1 }), after: null })
            })
        ])
    })

    it('distinguishes workspace member add and role change, then audits deletion', async () => {
        const owner = withAuditContext(
            await registerAccount({ user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' } }, requestContext)
        )
        const invite = await inviteAccount({ email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId }, owner)
        const member = await registerAccount(
            { user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: invite.tempToken } },
            requestContext
        )
        const secondWorkspace = await createWorkspace({ name: 'Second' }, owner)
        const memberRole = (await adminService.listRoles()).find((role) => role.name === 'member')!
        const adminRole = (await adminService.listRoles()).find((role) => role.name === 'admin')!

        const membership = await updateWorkspaceUserRole(
            { userId: member.id, workspaceId: secondWorkspace.id, roleId: memberRole.id },
            owner
        )
        await updateWorkspaceUserRole({ userId: member.id, workspaceId: secondWorkspace.id, roleId: adminRole.id }, owner)
        await deleteWorkspaceUser(secondWorkspace.id, member.id, owner)

        expect((await auditRows()).filter((row) => row.action.startsWith('workspaceUser.'))).toEqual([
            expect.objectContaining({
                action: 'workspaceUser.add',
                targetId: membership.id,
                targetName: member.email,
                organizationId: owner.activeOrganizationId,
                workspaceId: secondWorkspace.id,
                metadata: expect.objectContaining({ before: null, after: expect.objectContaining({ roleName: 'member' }) })
            }),
            expect.objectContaining({
                action: 'workspaceUser.roleChange',
                targetId: membership.id,
                metadata: expect.objectContaining({
                    before: expect.objectContaining({ roleName: 'member' }),
                    after: expect.objectContaining({ roleName: 'admin' })
                })
            }),
            expect.objectContaining({
                action: 'workspaceUser.delete',
                targetId: membership.id,
                targetName: member.email,
                metadata: expect.objectContaining({ before: expect.objectContaining({ roleName: 'admin' }), after: null })
            })
        ])
    })

    it('audits organization user status updates and deletion without trusting the body for organization scope', async () => {
        const owner = withAuditContext(
            await registerAccount({ user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' } }, requestContext)
        )
        const invite = await inviteAccount({ email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId }, owner)
        const member = await registerAccount(
            { user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: invite.tempToken } },
            requestContext
        )

        await updateOrganizationUser({ userId: member.id, status: 'disabled' }, owner)
        await deleteOrganizationUser(owner.activeOrganizationId, member.id, owner)

        expect((await auditRows()).filter((row) => row.action.startsWith('organizationUser.'))).toEqual([
            expect.objectContaining({
                action: 'organizationUser.update',
                targetId: member.id,
                targetName: member.email,
                organizationId: owner.activeOrganizationId,
                metadata: expect.objectContaining({ before: { status: 'active' }, after: { status: 'disabled' } })
            }),
            expect.objectContaining({
                action: 'organizationUser.delete',
                targetId: member.id,
                targetName: member.email,
                organizationId: owner.activeOrganizationId,
                metadata: expect.objectContaining({
                    before: expect.objectContaining({ status: 'disabled', workspaceIds: [owner.activeWorkspaceId] }),
                    after: null
                })
            })
        ])
    })

    it('does not record success for rejected guards and keeps the main write successful when audit persistence fails', async () => {
        const owner = withAuditContext(
            await registerAccount({ user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' } }, requestContext)
        )
        const builtin = (await adminService.listRoles()).find((role) => role.name === 'owner')!
        await expect(deleteRole(builtin.id, owner)).rejects.toMatchObject({ statusCode: 400 })
        expect((await auditRows()).some((row) => row.action === 'role.delete' && row.targetId === builtin.id)).toBe(false)

        dataSource.getRepository(FlowOpsAuditLog).save = jest.fn(() => Promise.reject(new Error('audit unavailable'))) as any
        await expect(createRole({ name: 'operator' }, owner)).resolves.toMatchObject({ name: 'operator' })
        await expect(adminService.getRoleByName('operator')).resolves.toMatchObject({ name: 'operator' })
    })
})
