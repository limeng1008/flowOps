import { DataSource } from 'typeorm'
import { ChatFlow } from '../../../database/entities/ChatFlow'
import { FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { FlowOpsAuthError, FlowOpsLoggedInUser } from '../auth/types'
import { normalizePermissionJson, parsePermissionJson } from '../rbac/permissions'
import { assertCanAddOrganizationUser, getOrganizationUserCount, getSelfSeatLimit, isOrganizationUser } from '../seats'
import { FlowOpsAuditService } from '../audit/service'
import type { FlowOpsAuthenticatedAuditActor } from '../audit/context'

type RoleBody = {
    id?: string
    name?: string
    description?: string
    permissions?: string | string[]
}

type WorkspaceBody = {
    id?: string
    name?: string
    description?: string
    organizationId?: string
    existingWorkspaceId?: string
}

type WorkspaceMemberBody = {
    userId?: string
    workspaceId?: string
    roleId?: string
}

type OrganizationUserBody = {
    userId?: string
    status?: string
}

const lowerStatus = (status?: string): string | undefined => status?.trim().toLowerCase()

const getFlowOpsAuthService = () =>
    require('../auth/service') as {
        FlowOpsAuthService: new (dataSource: DataSource) => {
            getLoggedInUser: (userId: string, preferredWorkspaceId?: string) => Promise<FlowOpsLoggedInUser>
        }
    }

const roleSnapshot = (role: FlowOpsRole) => ({
    name: role.name,
    description: role.description ?? null,
    permissions: [...parsePermissionJson(role.permissions)].sort(),
    isBuiltin: role.isBuiltin
})

const workspaceSnapshot = (workspace: FlowOpsWorkspace, userCount?: number) => ({
    name: workspace.name,
    description: workspace.description ?? null,
    ...(userCount === undefined ? {} : { userCount })
})

export class FlowOpsAdminService {
    private readonly auditService: FlowOpsAuditService

    constructor(private readonly dataSource: DataSource) {
        this.auditService = new FlowOpsAuditService(dataSource)
    }

    async listRoles(): Promise<Array<FlowOpsRole & { userCount: number }>> {
        const roles = await this.dataSource.getRepository(FlowOpsRole).find()
        const members = await this.dataSource.getRepository(FlowOpsWorkspaceMember).find()
        return roles.map((role) => ({
            ...role,
            userCount: members.filter((member) => member.roleId === role.id).length
        }))
    }

    async getRoleById(id: string): Promise<FlowOpsRole> {
        const role = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ id })
        if (!role) throw new FlowOpsAuthError(404, 'Role not found')
        return role
    }

    async getRoleByName(name: string): Promise<FlowOpsRole> {
        const role = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ name })
        if (!role) throw new FlowOpsAuthError(404, 'Role not found')
        return role
    }

    async createRole(body: RoleBody, actor: FlowOpsAuthenticatedAuditActor): Promise<FlowOpsRole> {
        const name = body.name?.trim()
        if (!name) throw new FlowOpsAuthError(400, 'Role name is required')
        const existing = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ name })
        if (existing) throw new FlowOpsAuthError(409, 'Role already exists')

        const role = this.dataSource.getRepository(FlowOpsRole).create({
            name,
            description: body.description ?? null,
            permissions: normalizePermissionJson(body.permissions ?? []),
            isBuiltin: false
        })
        const saved = await this.dataSource.getRepository(FlowOpsRole).save(role)
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'role.create',
            targetType: 'role',
            targetId: saved.id,
            targetName: saved.name,
            organizationId: actor.activeOrganizationId,
            workspaceId: actor.activeWorkspaceId,
            status: 'success',
            metadata: { after: roleSnapshot(saved) }
        })
        return saved
    }

    async updateRole(body: RoleBody, actor: FlowOpsAuthenticatedAuditActor): Promise<FlowOpsRole> {
        if (!body.id) throw new FlowOpsAuthError(400, 'Role id is required')
        const repo = this.dataSource.getRepository(FlowOpsRole)
        const role = await repo.findOneBy({ id: body.id })
        if (!role) throw new FlowOpsAuthError(404, 'Role not found')

        const before = roleSnapshot(role)
        const nextName = body.name?.trim() || role.name
        if (role.isBuiltin && nextName !== role.name) throw new FlowOpsAuthError(400, 'Built-in role names cannot be changed')
        if (!role.isBuiltin && nextName !== role.name) {
            const existing = await repo.findOneBy({ name: nextName })
            if (existing && existing.id !== role.id) throw new FlowOpsAuthError(409, 'Role already exists')
        }

        role.name = nextName
        role.description = body.description ?? role.description
        if (body.permissions !== undefined) role.permissions = normalizePermissionJson(body.permissions)
        const saved = await repo.save(role)
        const after = roleSnapshot(saved)
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'role.update',
            targetType: 'role',
            targetId: saved.id,
            targetName: saved.name,
            organizationId: actor.activeOrganizationId,
            workspaceId: actor.activeWorkspaceId,
            status: 'success',
            metadata: {
                before,
                after,
                permissionsAdded: after.permissions.filter((permission) => !before.permissions.includes(permission)),
                permissionsRemoved: before.permissions.filter((permission) => !after.permissions.includes(permission))
            }
        })
        return saved
    }

    async deleteRole(id: string, actor: FlowOpsAuthenticatedAuditActor): Promise<{ success: true }> {
        const role = await this.getRoleById(id)
        if (role.isBuiltin) throw new FlowOpsAuthError(400, 'Built-in roles cannot be deleted')
        const assigned = await this.dataSource.getRepository(FlowOpsWorkspaceMember).countBy({ roleId: id })
        if (assigned > 0) throw new FlowOpsAuthError(400, 'Role is assigned to users')
        const before = roleSnapshot(role)
        await this.dataSource.getRepository(FlowOpsRole).delete({ id })
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'role.delete',
            targetType: 'role',
            targetId: role.id,
            targetName: role.name,
            organizationId: actor.activeOrganizationId,
            workspaceId: actor.activeWorkspaceId,
            status: 'success',
            metadata: { before, after: null }
        })
        return { success: true }
    }

    async listWorkspaces(organizationId?: string): Promise<Array<FlowOpsWorkspace & { userCount: number; isOrgDefault: boolean }>> {
        const repo = this.dataSource.getRepository(FlowOpsWorkspace)
        const workspaces = organizationId ? await repo.findBy({ organizationId }) : await repo.find()
        const members = await this.dataSource.getRepository(FlowOpsWorkspaceMember).find()
        return workspaces.map((workspace) => ({
            ...workspace,
            userCount: members.filter((member) => member.workspaceId === workspace.id).length,
            isOrgDefault: workspace.name === 'Default Workspace'
        }))
    }

    async getWorkspaceById(id: string): Promise<FlowOpsWorkspace & { userCount: number; isOrgDefault: boolean }> {
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        const userCount = await this.dataSource.getRepository(FlowOpsWorkspaceMember).countBy({ workspaceId: id })
        return { ...workspace, userCount, isOrgDefault: workspace.name === 'Default Workspace' }
    }

    async createWorkspace(body: WorkspaceBody, actor: FlowOpsAuthenticatedAuditActor): Promise<FlowOpsWorkspace> {
        const name = body.name?.trim()
        const organizationId = actor.activeOrganizationId
        if (!name) throw new FlowOpsAuthError(400, 'Workspace name is required')
        if (!organizationId) throw new FlowOpsAuthError(400, 'Organization is required')

        const workspace = await this.dataSource.transaction(async (manager) => {
            const workspace = await manager.getRepository(FlowOpsWorkspace).save(
                manager.getRepository(FlowOpsWorkspace).create({
                    name,
                    description: body.description ?? null,
                    organizationId
                })
            )
            const inheritedMembership = body.existingWorkspaceId
                ? await manager.getRepository(FlowOpsWorkspaceMember).findOneBy({
                      workspaceId: body.existingWorkspaceId,
                      userId: actor.id
                  })
                : null
            const ownerRole = await manager.getRepository(FlowOpsRole).findOneBy({ name: 'owner' })
            const roleId = inheritedMembership?.roleId ?? ownerRole?.id
            if (!roleId) throw new FlowOpsAuthError(500, 'Missing built-in role: owner')
            await manager.getRepository(FlowOpsWorkspaceMember).save(
                manager.getRepository(FlowOpsWorkspaceMember).create({
                    workspaceId: workspace.id,
                    userId: actor.id,
                    roleId
                })
            )
            return workspace
        })
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'workspace.create',
            targetType: 'workspace',
            targetId: workspace.id,
            targetName: workspace.name,
            organizationId: workspace.organizationId,
            workspaceId: workspace.id,
            status: 'success',
            metadata: { after: workspaceSnapshot(workspace) }
        })
        return workspace
    }

    async updateWorkspace(body: WorkspaceBody, actor: FlowOpsAuthenticatedAuditActor): Promise<FlowOpsWorkspace> {
        if (!body.id) throw new FlowOpsAuthError(400, 'Workspace id is required')
        const repo = this.dataSource.getRepository(FlowOpsWorkspace)
        const workspace = await repo.findOneBy({ id: body.id })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        const before = workspaceSnapshot(workspace)
        workspace.name = body.name?.trim() || workspace.name
        workspace.description = body.description ?? workspace.description
        const saved = await repo.save(workspace)
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'workspace.update',
            targetType: 'workspace',
            targetId: saved.id,
            targetName: saved.name,
            organizationId: saved.organizationId,
            workspaceId: saved.id,
            status: 'success',
            metadata: { before, after: workspaceSnapshot(saved) }
        })
        return saved
    }

    async deleteWorkspace(id: string, actor: FlowOpsAuthenticatedAuditActor): Promise<{ success: true }> {
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        if (workspace.name === 'Default Workspace') throw new FlowOpsAuthError(400, 'Default Workspace cannot be deleted')
        const userCount = await this.dataSource.getRepository(FlowOpsWorkspaceMember).countBy({ workspaceId: id })
        if (userCount > 1) throw new FlowOpsAuthError(400, 'Workspace still has assigned users')
        const before = workspaceSnapshot(workspace, userCount)
        await this.dataSource.getRepository(ChatFlow).delete({ workspaceId: id })
        await this.dataSource.getRepository(FlowOpsWorkspaceMember).delete({ workspaceId: id })
        await this.dataSource.getRepository(FlowOpsWorkspace).delete({ id })
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'workspace.delete',
            targetType: 'workspace',
            targetId: workspace.id,
            targetName: workspace.name,
            organizationId: workspace.organizationId,
            workspaceId: workspace.id,
            status: 'success',
            metadata: { before, after: null }
        })
        return { success: true }
    }

    async switchWorkspace(workspaceId: string, actor: FlowOpsLoggedInUser): Promise<FlowOpsLoggedInUser> {
        const membership = await this.dataSource.getRepository(FlowOpsWorkspaceMember).findOneBy({ workspaceId, userId: actor.id })
        if (!membership) throw new FlowOpsAuthError(403, 'Workspace is not assigned to user')
        const { FlowOpsAuthService } = getFlowOpsAuthService()
        return await new FlowOpsAuthService(this.dataSource).getLoggedInUser(actor.id, workspaceId)
    }

    async listWorkspaceUsers(workspaceId: string) {
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id: workspaceId })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        const organization = await this.dataSource.getRepository(FlowOpsOrganization).findOneBy({ id: workspace.organizationId })
        const members = await this.dataSource.getRepository(FlowOpsWorkspaceMember).findBy({ workspaceId })
        return await this.hydrateMemberships(members, organization?.ownerUserId)
    }

    async listUsersByRoleId(roleId: string) {
        const members = await this.dataSource.getRepository(FlowOpsWorkspaceMember).findBy({ roleId })
        return await this.hydrateMemberships(members)
    }

    async updateWorkspaceUserRole(body: WorkspaceMemberBody, actor: FlowOpsAuthenticatedAuditActor): Promise<FlowOpsWorkspaceMember> {
        if (!body.userId || !body.workspaceId || !body.roleId) throw new FlowOpsAuthError(400, 'User, workspace, and role are required')
        const repo = this.dataSource.getRepository(FlowOpsWorkspaceMember)
        const role = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ id: body.roleId })
        if (!role) throw new FlowOpsAuthError(404, 'Role not found')
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id: body.workspaceId })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: body.userId })
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        // upsert:成员不存在则把用户加入该工作区(赋角色),已存在则改角色。
        // PUT 端点权限为 workspace:add-user,语义即"把用户加进/调整到某工作区"。
        const existingMembership = await repo.findOneBy({ userId: body.userId, workspaceId: body.workspaceId })
        if (!existingMembership && !(await isOrganizationUser(this.dataSource, workspace.organizationId, user.id))) {
            await assertCanAddOrganizationUser(this.dataSource, workspace.organizationId)
        }
        const previousRole = existingMembership
            ? await this.dataSource.getRepository(FlowOpsRole).findOneBy({ id: existingMembership.roleId })
            : null
        const before = existingMembership
            ? { roleId: existingMembership.roleId, roleName: previousRole?.name ?? null, workspaceName: workspace.name }
            : null
        const membership = existingMembership ?? repo.create({ userId: body.userId, workspaceId: body.workspaceId, roleId: role.id })
        membership.roleId = role.id
        const saved = await repo.save(membership)
        await this.auditService.recordAuditEvent({
            ...actor,
            action: existingMembership ? 'workspaceUser.roleChange' : 'workspaceUser.add',
            targetType: 'workspaceUser',
            targetId: saved.id,
            targetName: user.email,
            organizationId: workspace.organizationId,
            workspaceId: workspace.id,
            status: 'success',
            metadata: {
                before,
                after: { roleId: role.id, roleName: role.name, workspaceName: workspace.name, userName: user.name ?? null }
            }
        })
        return saved
    }

    async deleteWorkspaceUser(workspaceId: string, userId: string, actor: FlowOpsAuthenticatedAuditActor): Promise<{ success: true }> {
        const memberRepo = this.dataSource.getRepository(FlowOpsWorkspaceMember)
        // 护栏1:组织 owner 不可被移出工作区(与 deleteOrganizationUser 一致,防把管理员锁死)
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id: workspaceId })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        const organization = workspace
            ? await this.dataSource.getRepository(FlowOpsOrganization).findOneBy({ id: workspace.organizationId })
            : null
        if (organization?.ownerUserId === userId) throw new FlowOpsAuthError(400, 'Organization owner cannot be removed from a workspace')
        const membership = await memberRepo.findOneBy({ workspaceId, userId })
        if (!membership) throw new FlowOpsAuthError(404, 'Workspace user not found')
        const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: userId })
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        const role = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ id: membership.roleId })
        // 护栏2:不可移除用户的最后一个工作区(否则登录后零工作区、无法使用;停用请走状态开关)
        const membershipCount = await memberRepo.countBy({ userId })
        if (membershipCount <= 1) throw new FlowOpsAuthError(400, "Cannot remove the user's last workspace")
        const result = await memberRepo.delete({ workspaceId, userId })
        if (!result.affected) throw new FlowOpsAuthError(404, 'Workspace user not found')
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'workspaceUser.delete',
            targetType: 'workspaceUser',
            targetId: membership.id,
            targetName: user.email,
            organizationId: workspace.organizationId,
            workspaceId: workspace.id,
            status: 'success',
            metadata: {
                before: {
                    roleId: membership.roleId,
                    roleName: role?.name ?? null,
                    workspaceName: workspace.name,
                    userName: user.name ?? null
                },
                after: null
            }
        })
        return { success: true }
    }

    async listOrganizationUsers(organizationId: string) {
        const workspaces = await this.dataSource.getRepository(FlowOpsWorkspace).findBy({ organizationId })
        const organizations = await this.dataSource.getRepository(FlowOpsOrganization).findBy({ id: organizationId })
        const ownerUserId = organizations[0]?.ownerUserId
        const workspaceIds = new Set(workspaces.map((workspace) => workspace.id))
        const memberships = (await this.dataSource.getRepository(FlowOpsWorkspaceMember).find()).filter((member) =>
            workspaceIds.has(member.workspaceId)
        )
        const users = await this.dataSource.getRepository(FlowOpsUser).find()

        return await Promise.all(
            users
                .filter((user) => memberships.some((member) => member.userId === user.id) || user.id === ownerUserId)
                .map(async (user) => {
                    const userMemberships = memberships.filter((member) => member.userId === user.id)
                    const hydrated = await this.hydrateMemberships(userMemberships, ownerUserId)
                    return {
                        userId: user.id,
                        organizationId,
                        user,
                        status: user.status,
                        lastLogin: user.lastLogin,
                        roleCount: userMemberships.length,
                        workspaceNames: hydrated.map((item) => item.workspace),
                        assignedRoles: hydrated.map((item) => ({ role: item.role.name, workspace: item.workspace.name })),
                        isOrgOwner: user.id === ownerUserId
                    }
                })
        )
    }

    async getOrganizationUser(organizationId: string, userId: string) {
        const users = await this.listOrganizationUsers(organizationId)
        const user = users.find((item) => item.userId === userId)
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        return user
    }

    async updateOrganizationUser(body: OrganizationUserBody, actor: FlowOpsAuthenticatedAuditActor): Promise<FlowOpsUser> {
        if (!body.userId) throw new FlowOpsAuthError(400, 'User id is required')
        const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: body.userId })
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        if (!(await isOrganizationUser(this.dataSource, actor.activeOrganizationId, user.id)))
            throw new FlowOpsAuthError(404, 'User not found')
        const before = { status: user.status }
        const status = lowerStatus(body.status)
        if (status) user.status = status
        const saved = await this.dataSource.getRepository(FlowOpsUser).save(user)
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'organizationUser.update',
            targetType: 'organizationUser',
            targetId: saved.id,
            targetName: saved.email,
            organizationId: actor.activeOrganizationId,
            workspaceId: actor.activeWorkspaceId,
            status: 'success',
            metadata: { before, after: { status: saved.status } }
        })
        return saved
    }

    async deleteOrganizationUser(
        organizationId: string,
        userId: string,
        actor: FlowOpsAuthenticatedAuditActor
    ): Promise<{ success: true }> {
        if (organizationId !== actor.activeOrganizationId) throw new FlowOpsAuthError(403, 'Forbidden')
        const organization = await this.dataSource.getRepository(FlowOpsOrganization).findOneBy({ id: organizationId })
        if (!organization) throw new FlowOpsAuthError(404, 'Organization not found')
        if (organization?.ownerUserId === userId) throw new FlowOpsAuthError(400, 'Organization owner cannot be removed')
        const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: userId })
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        const workspaces = await this.dataSource.getRepository(FlowOpsWorkspace).findBy({ organizationId })
        const workspaceIds: string[] = []
        for (const workspace of workspaces) {
            const membership = await this.dataSource.getRepository(FlowOpsWorkspaceMember).findOneBy({ workspaceId: workspace.id, userId })
            if (membership) workspaceIds.push(workspace.id)
        }
        if (workspaceIds.length === 0) throw new FlowOpsAuthError(404, 'User not found')
        for (const workspace of workspaces)
            await this.dataSource.getRepository(FlowOpsWorkspaceMember).delete({ workspaceId: workspace.id, userId })
        await this.dataSource.getRepository(FlowOpsUser).delete({ id: userId })
        await this.auditService.recordAuditEvent({
            ...actor,
            action: 'organizationUser.delete',
            targetType: 'organizationUser',
            targetId: user.id,
            targetName: user.email,
            organizationId,
            workspaceId: actor.activeWorkspaceId,
            status: 'success',
            metadata: { before: { name: user.name ?? null, status: user.status, workspaceIds }, after: null }
        })
        return { success: true }
    }

    async getUserById(id: string): Promise<FlowOpsUser> {
        const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id })
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        return user
    }

    async updateUser(body: { id?: string; userId?: string; name?: string; status?: string }): Promise<FlowOpsUser> {
        const user = await this.getUserById(body.id ?? body.userId ?? '')
        user.name = body.name ?? user.name
        user.status = lowerStatus(body.status) ?? user.status
        return await this.dataSource.getRepository(FlowOpsUser).save(user)
    }

    async listWorkspacesByUserId(userId: string) {
        const members = await this.dataSource.getRepository(FlowOpsWorkspaceMember).findBy({ userId })
        return await this.hydrateMemberships(members)
    }

    async listWorkspacesByOrganizationIdUserId(organizationId: string, userId: string) {
        const workspaces = await this.dataSource.getRepository(FlowOpsWorkspace).findBy({ organizationId })
        const workspaceIds = new Set(workspaces.map((workspace) => workspace.id))
        const members = (await this.dataSource.getRepository(FlowOpsWorkspaceMember).findBy({ userId })).filter((member) =>
            workspaceIds.has(member.workspaceId)
        )
        return await this.hydrateMemberships(members)
    }

    async listOrganizations(actor?: FlowOpsLoggedInUser) {
        const organizations = await this.dataSource.getRepository(FlowOpsOrganization).find()
        const organization = actor?.activeOrganizationId
            ? organizations.find((item) => item.id === actor.activeOrganizationId) ?? organizations[0]
            : organizations[0]
        if (!organization) return []

        const userCount = await this.dataSource.getRepository(FlowOpsUser).count()
        const workspaceCount = await this.dataSource.getRepository(FlowOpsWorkspace).countBy({ organizationId: organization.id })
        return [
            {
                ...organization,
                subscriptionId: null,
                customerId: null,
                productId: null,
                plan: null,
                userCount,
                workspaceCount
            }
        ]
    }

    async getAdditionalSeatsQuantity(organizationId?: string) {
        const totalOrgUsers = await this.getOrganizationUserCountForUsage(organizationId)
        return {
            includedSeats: getSelfSeatLimit(),
            quantity: 0,
            totalOrgUsers
        }
    }

    async getCurrentUsage(organizationId?: string) {
        const resolvedOrganizationId = await this.resolveOrganizationId(organizationId)
        const userCount = resolvedOrganizationId
            ? await getOrganizationUserCount(this.dataSource, resolvedOrganizationId)
            : await this.dataSource.getRepository(FlowOpsUser).count()
        const workspaceCount = resolvedOrganizationId
            ? await this.dataSource.getRepository(FlowOpsWorkspace).countBy({ organizationId: resolvedOrganizationId })
            : await this.dataSource.getRepository(FlowOpsWorkspace).count()
        return {
            users: { usage: userCount, limit: getSelfSeatLimit() },
            workspaces: { usage: workspaceCount, limit: -1 },
            predictions: { usage: 0, limit: -1 },
            storage: { usage: 0, limit: -1 }
        }
    }

    private async resolveOrganizationId(organizationId?: string): Promise<string | undefined> {
        if (organizationId) return organizationId
        const organizations = await this.dataSource.getRepository(FlowOpsOrganization).find()
        return organizations[0]?.id
    }

    private async getOrganizationUserCountForUsage(organizationId?: string): Promise<number> {
        const resolvedOrganizationId = await this.resolveOrganizationId(organizationId)
        if (!resolvedOrganizationId) return await this.dataSource.getRepository(FlowOpsUser).count()
        return await getOrganizationUserCount(this.dataSource, resolvedOrganizationId)
    }

    private async hydrateMemberships(members: FlowOpsWorkspaceMember[], ownerUserId?: string | null) {
        const rows = []
        for (const member of members) {
            const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: member.userId })
            const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id: member.workspaceId })
            const role = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ id: member.roleId })
            if (!user || !workspace || !role) continue
            rows.push({
                ...member,
                user,
                workspace,
                role,
                status: user.status,
                lastLogin: user.lastLogin,
                isOrgOwner: ownerUserId ? user.id === ownerUserId : false
            })
        }
        return rows
    }
}
