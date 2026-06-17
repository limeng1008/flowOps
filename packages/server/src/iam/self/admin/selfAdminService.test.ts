import { describe, expect, it, beforeEach } from '@jest/globals'
import type { DataSource } from 'typeorm'
import { ChatFlow } from '../../../database/entities/ChatFlow'
import { FlowOpsLoginActivity, FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { FlowOpsAuthService } from '../auth/service'
import { FlowOpsAdminService } from './service'
import { ALL_SELF_PERMISSIONS, BUILTIN_SELF_ROLE_PERMISSIONS, MEMBER_SELF_PERMISSIONS } from '../rbac/permissions'
import { getWorkspaceSearchOptions } from '../workspace/query'

const entities = [FlowOpsUser, FlowOpsOrganization, FlowOpsWorkspace, FlowOpsWorkspaceMember, FlowOpsRole, FlowOpsLoginActivity, ChatFlow]

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

    beforeEach(async () => {
        process.env.JWT_AUTH_TOKEN_SECRET = 'test-access-secret'
        process.env.JWT_REFRESH_TOKEN_SECRET = 'test-refresh-secret'
        dataSource = makeInMemoryDataSource()
        await seedRoles(dataSource)
        authService = new FlowOpsAuthService(dataSource)
        adminService = new FlowOpsAdminService(dataSource)
    })

    it('returns builtin role permissions for owner, admin, and member sessions', async () => {
        const owner = await authService.registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        expect(owner.permissions).toEqual(ALL_SELF_PERMISSIONS)
        expect(owner.isOrganizationAdmin).toBe(true)

        const adminInvite = await authService.inviteAccount(
            { email: 'admin@example.com', roleName: 'admin', workspaceId: owner.activeWorkspaceId },
            owner
        )
        const admin = await authService.registerAccount({
            user: { name: 'Admin', email: 'admin@example.com', credential: 'Password1!', tempToken: adminInvite.tempToken }
        })
        expect(admin.role).toBe('admin')
        expect(admin.isOrganizationAdmin).toBe(false)
        expect(admin.permissions).toContain('users:manage')
        expect(admin.permissions).toContain('workspace:create')
        expect(admin.permissions).not.toContain('sso:manage')

        const memberInvite = await authService.inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            owner
        )
        const member = await authService.registerAccount({
            user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: memberInvite.tempToken }
        })
        expect(member.role).toBe('member')
        expect(member.permissions).toEqual(MEMBER_SELF_PERMISSIONS)
        expect(member.permissions).not.toContain('roles:manage')
    })

    it('protects builtin role names and supports custom role CRUD', async () => {
        const custom = await adminService.createRole({
            name: 'analyst',
            description: 'Can inspect chatflows',
            permissions: JSON.stringify(['chatflows:view'])
        })
        expect(custom.name).toBe('analyst')

        const roles = await adminService.listRoles()
        const ownerRole = roles.find((role) => role.name === 'owner')!

        await expect(adminService.updateRole({ id: ownerRole.id, name: 'renamed-owner' })).rejects.toMatchObject({
            statusCode: 400,
            message: 'Built-in role names cannot be changed'
        })
        await expect(adminService.deleteRole(ownerRole.id)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Built-in roles cannot be deleted'
        })

        const updated = await adminService.updateRole({ id: custom.id, name: 'analyst', permissions: JSON.stringify(['chatflows:view']) })
        expect(updated.permissions).toBe(JSON.stringify(['chatflows:view']))
        await expect(adminService.deleteRole(custom.id)).resolves.toMatchObject({ success: true })
    })

    it('switches workspaces, scopes workspace queries, and rejects unassigned workspaces', async () => {
        const owner = await authService.registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const defaultWorkspaceId = owner.activeWorkspaceId!
        const researchWorkspace = await adminService.createWorkspace(
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

        const memberInvite = await authService.inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: defaultWorkspaceId },
            owner
        )
        const member = await authService.registerAccount({
            user: { name: 'Member', email: 'member@example.com', credential: 'Password1!', tempToken: memberInvite.tempToken }
        })
        await expect(adminService.switchWorkspace(researchWorkspace.id, member)).rejects.toMatchObject({
            statusCode: 403,
            message: 'Workspace is not assigned to user'
        })
    })

    it('lists organization users and updates workspace roles', async () => {
        const owner = await authService.registerAccount({
            user: { name: 'Owner', email: 'owner@example.com', credential: 'Password1!' }
        })
        const memberInvite = await authService.inviteAccount(
            { email: 'member@example.com', roleName: 'member', workspaceId: owner.activeWorkspaceId },
            owner
        )
        const member = await authService.registerAccount({
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

        await adminService.updateWorkspaceUserRole({
            userId: member.id,
            workspaceId: owner.activeWorkspaceId,
            roleId: adminRole.id
        })
        const promotedMember = await authService.getLoggedInUser(member.id, owner.activeWorkspaceId)
        expect(promotedMember.role).toBe('admin')

        // 护栏:member 当前只在一个工作区,删除其最后一个工作区应被拒
        await expect(adminService.deleteWorkspaceUser(owner.activeWorkspaceId!, member.id)).rejects.toMatchObject({
            statusCode: 400,
            message: "Cannot remove the user's last workspace"
        })

        // upsert:updateWorkspaceUserRole 对不存在的成员应「新增」(把 member 加入第二个工作区)
        const secondWorkspace = await adminService.createWorkspace({ name: 'Second', organizationId: owner.activeOrganizationId }, owner)
        const memberRole = (await adminService.listRoles()).find((role) => role.name === 'member')!
        await adminService.updateWorkspaceUserRole({ userId: member.id, workspaceId: secondWorkspace.id, roleId: memberRole.id })
        await expect(adminService.listWorkspacesByUserId(member.id)).resolves.toHaveLength(2)

        // 现在 member 有两个工作区,移除其中一个应成功
        await expect(adminService.deleteWorkspaceUser(owner.activeWorkspaceId!, member.id)).resolves.toMatchObject({ success: true })
        await expect(adminService.listWorkspaceUsers(owner.activeWorkspaceId!)).resolves.toHaveLength(1)
        await expect(adminService.listWorkspacesByUserId(member.id)).resolves.toHaveLength(1)

        // 护栏:组织 owner 不可被移出工作区
        await expect(adminService.deleteWorkspaceUser(owner.activeWorkspaceId!, owner.id)).rejects.toMatchObject({
            statusCode: 400,
            message: 'Organization owner cannot be removed from a workspace'
        })
    })
})
