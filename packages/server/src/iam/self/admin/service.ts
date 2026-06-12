import { DataSource, EntityManager } from 'typeorm'
import { ChatFlow } from '../../../database/entities/ChatFlow'
import { FlowOpsLoginActivity, FlowOpsOrganization, FlowOpsRole, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from '../entities'
import { FlowOpsAuthError, FlowOpsLoggedInUser } from '../auth/types'
import { normalizePermissionJson } from '../rbac/permissions'

type RepositorySource = DataSource | EntityManager

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

type LoginActivityBody = {
    pageNo?: number | string
    pageSize?: number | string
    startDate?: Date | string
    endDate?: Date | string
    activityCodes?: Array<number | string>
}

const lowerStatus = (status?: string): string | undefined => status?.trim().toLowerCase()

const toPositiveInteger = (value: number | string | undefined, fallback: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const toDate = (value?: Date | string): Date | undefined => {
    if (!value) return undefined
    const date = value instanceof Date ? value : new Date(value)
    return Number.isFinite(date.getTime()) ? date : undefined
}

const getFlowOpsAuthService = () =>
    require('../auth/service') as {
        FlowOpsAuthService: new (dataSource: DataSource) => {
            getLoggedInUser: (userId: string, preferredWorkspaceId?: string) => Promise<FlowOpsLoggedInUser>
        }
    }

export class FlowOpsAdminService {
    constructor(private readonly dataSource: DataSource) {}

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

    async createRole(body: RoleBody): Promise<FlowOpsRole> {
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
        return await this.dataSource.getRepository(FlowOpsRole).save(role)
    }

    async updateRole(body: RoleBody): Promise<FlowOpsRole> {
        if (!body.id) throw new FlowOpsAuthError(400, 'Role id is required')
        const repo = this.dataSource.getRepository(FlowOpsRole)
        const role = await repo.findOneBy({ id: body.id })
        if (!role) throw new FlowOpsAuthError(404, 'Role not found')

        const nextName = body.name?.trim() || role.name
        if (role.isBuiltin && nextName !== role.name) throw new FlowOpsAuthError(400, 'Built-in role names cannot be changed')
        if (!role.isBuiltin && nextName !== role.name) {
            const existing = await repo.findOneBy({ name: nextName })
            if (existing && existing.id !== role.id) throw new FlowOpsAuthError(409, 'Role already exists')
        }

        role.name = nextName
        role.description = body.description ?? role.description
        if (body.permissions !== undefined) role.permissions = normalizePermissionJson(body.permissions)
        return await repo.save(role)
    }

    async deleteRole(id: string): Promise<{ success: true }> {
        const role = await this.getRoleById(id)
        if (role.isBuiltin) throw new FlowOpsAuthError(400, 'Built-in roles cannot be deleted')
        const assigned = await this.dataSource.getRepository(FlowOpsWorkspaceMember).countBy({ roleId: id })
        if (assigned > 0) throw new FlowOpsAuthError(400, 'Role is assigned to users')
        await this.dataSource.getRepository(FlowOpsRole).delete({ id })
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

    async createWorkspace(body: WorkspaceBody, actor: FlowOpsLoggedInUser): Promise<FlowOpsWorkspace> {
        const name = body.name?.trim()
        const organizationId = body.organizationId ?? actor.activeOrganizationId
        if (!name) throw new FlowOpsAuthError(400, 'Workspace name is required')
        if (!organizationId) throw new FlowOpsAuthError(400, 'Organization is required')

        return await this.dataSource.transaction(async (manager) => {
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
    }

    async updateWorkspace(body: WorkspaceBody): Promise<FlowOpsWorkspace> {
        if (!body.id) throw new FlowOpsAuthError(400, 'Workspace id is required')
        const repo = this.dataSource.getRepository(FlowOpsWorkspace)
        const workspace = await repo.findOneBy({ id: body.id })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        workspace.name = body.name?.trim() || workspace.name
        workspace.description = body.description ?? workspace.description
        return await repo.save(workspace)
    }

    async deleteWorkspace(id: string): Promise<{ success: true }> {
        const workspace = await this.dataSource.getRepository(FlowOpsWorkspace).findOneBy({ id })
        if (!workspace) throw new FlowOpsAuthError(404, 'Workspace not found')
        if (workspace.name === 'Default Workspace') throw new FlowOpsAuthError(400, 'Default Workspace cannot be deleted')
        const userCount = await this.dataSource.getRepository(FlowOpsWorkspaceMember).countBy({ workspaceId: id })
        if (userCount > 1) throw new FlowOpsAuthError(400, 'Workspace still has assigned users')
        await this.dataSource.getRepository(ChatFlow).delete({ workspaceId: id })
        await this.dataSource.getRepository(FlowOpsWorkspaceMember).delete({ workspaceId: id })
        await this.dataSource.getRepository(FlowOpsWorkspace).delete({ id })
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

    async updateWorkspaceUserRole(body: WorkspaceMemberBody): Promise<FlowOpsWorkspaceMember> {
        if (!body.userId || !body.workspaceId || !body.roleId) throw new FlowOpsAuthError(400, 'User, workspace, and role are required')
        const repo = this.dataSource.getRepository(FlowOpsWorkspaceMember)
        const membership = await repo.findOneBy({ userId: body.userId, workspaceId: body.workspaceId })
        if (!membership) throw new FlowOpsAuthError(404, 'Workspace user not found')
        const role = await this.dataSource.getRepository(FlowOpsRole).findOneBy({ id: body.roleId })
        if (!role) throw new FlowOpsAuthError(404, 'Role not found')
        membership.roleId = role.id
        return await repo.save(membership)
    }

    async deleteWorkspaceUser(workspaceId: string, userId: string): Promise<{ success: true }> {
        const result = await this.dataSource.getRepository(FlowOpsWorkspaceMember).delete({ workspaceId, userId })
        if (!result.affected) throw new FlowOpsAuthError(404, 'Workspace user not found')
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

    async updateOrganizationUser(body: OrganizationUserBody): Promise<FlowOpsUser> {
        if (!body.userId) throw new FlowOpsAuthError(400, 'User id is required')
        const user = await this.dataSource.getRepository(FlowOpsUser).findOneBy({ id: body.userId })
        if (!user) throw new FlowOpsAuthError(404, 'User not found')
        const status = lowerStatus(body.status)
        if (status) user.status = status
        return await this.dataSource.getRepository(FlowOpsUser).save(user)
    }

    async deleteOrganizationUser(organizationId: string, userId: string): Promise<{ success: true }> {
        const organization = await this.dataSource.getRepository(FlowOpsOrganization).findOneBy({ id: organizationId })
        if (organization?.ownerUserId === userId) throw new FlowOpsAuthError(400, 'Organization owner cannot be removed')
        const workspaces = await this.dataSource.getRepository(FlowOpsWorkspace).findBy({ organizationId })
        for (const workspace of workspaces)
            await this.dataSource.getRepository(FlowOpsWorkspaceMember).delete({ workspaceId: workspace.id, userId })
        await this.dataSource.getRepository(FlowOpsUser).delete({ id: userId })
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

    async listLoginActivity(body: LoginActivityBody = {}) {
        const currentPage = toPositiveInteger(body.pageNo, 1)
        const pageSize = toPositiveInteger(body.pageSize, 50)
        const startDate = toDate(body.startDate)
        const endDate = toDate(body.endDate)
        const activityCodes = new Set((body.activityCodes ?? []).map((activityCode) => String(activityCode)))
        const activities = await this.dataSource.getRepository(FlowOpsLoginActivity).find()
        const users = await this.dataSource.getRepository(FlowOpsUser).find()
        const usersById = new Map(users.map((user) => [user.id, user]))

        const filtered = activities
            .filter((activity) => {
                const activityDate = activity.createdDate ?? activity.updatedDate ?? new Date(0)
                const timestamp = activityDate.getTime()
                if (startDate && timestamp < startDate.getTime()) return false
                if (endDate && timestamp > endDate.getTime()) return false
                if (activityCodes.size > 0 && !activityCodes.has(String(activity.activityCode))) return false
                return true
            })
            .sort((left, right) => {
                const leftDate = left.createdDate ?? left.updatedDate ?? new Date(0)
                const rightDate = right.createdDate ?? right.updatedDate ?? new Date(0)
                return rightDate.getTime() - leftDate.getTime()
            })

        const offset = (currentPage - 1) * pageSize
        const data = filtered.slice(offset, offset + pageSize).map((activity) => {
            const user = activity.userId ? usersById.get(activity.userId) : undefined
            const attemptedDateTime = activity.createdDate ?? activity.updatedDate ?? new Date()
            return {
                id: activity.id,
                userId: activity.userId,
                username: user?.email ?? user?.name ?? 'Unknown User',
                activityCode: Number(activity.activityCode),
                attemptedDateTime,
                loginMode: null,
                message: activity.message,
                ip: activity.ip
            }
        })

        return {
            data,
            count: filtered.length,
            currentPage,
            pageSize
        }
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

    async getAdditionalSeatsQuantity() {
        const totalOrgUsers = await this.dataSource.getRepository(FlowOpsUser).count()
        return {
            includedSeats: Math.max(totalOrgUsers, 1),
            quantity: 0,
            totalOrgUsers
        }
    }

    async getCurrentUsage() {
        const userCount = await this.dataSource.getRepository(FlowOpsUser).count()
        const workspaceCount = await this.dataSource.getRepository(FlowOpsWorkspace).count()
        return {
            users: { usage: userCount, limit: -1 },
            workspaces: { usage: workspaceCount, limit: -1 },
            predictions: { usage: 0, limit: -1 },
            storage: { usage: 0, limit: -1 }
        }
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
