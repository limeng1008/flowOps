import { StatusCodes } from 'http-status-codes'
import { DataSource, IsNull, QueryRunner } from 'typeorm'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { GeneralSuccessMessage } from '../../utils/constants'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import { GeneralRole, Role } from '../database/entities/role.entity'
import { Permissions } from '../rbac/Permissions'
import { WorkspaceUser } from '../database/entities/workspace-user.entity'
import { isInvalidName, isInvalidUUID } from '../utils/validation.util'
import { OrganizationErrorMessage, OrganizationService } from './organization.service'
import { UserErrorMessage, UserService } from './user.service'

export const enum RoleErrorMessage {
    INVALID_ROLE_ID = 'Invalid Role Id',
    INVALID_ROLE_NAME = 'Invalid Role Name',
    INVALID_ROLE_PERMISSIONS = 'Invalid Role Permissions',
    ROLE_NOT_FOUND = 'Role Not Found',
    CUSTOM_ROLES_DISABLED = 'Custom roles are disabled in FlowOps simplified permissions',
    PRESET_ROLES_READ_ONLY = 'FlowOps preset roles are read-only'
}

export const FLOWOPS_WORKSPACE_ROLE_NAMES = [GeneralRole.OWNER, GeneralRole.ADMIN, GeneralRole.MEMBER, GeneralRole.VIEWER] as const

type FlowOpsWorkspaceRoleName = (typeof FLOWOPS_WORKSPACE_ROLE_NAMES)[number]

const FLOWOPS_WORKSPACE_ROLE_DESCRIPTIONS: Record<FlowOpsWorkspaceRoleName, string> = {
    [GeneralRole.OWNER]: 'Full workspace administration.',
    [GeneralRole.ADMIN]: 'Manage workspace content, members, credentials, and API keys without platform-only controls.',
    [GeneralRole.MEMBER]: 'Create and manage workspace content without credentials, API keys, or user administration.',
    [GeneralRole.VIEWER]: 'View workspace content and run conversations.'
}

const FLOWOPS_PLATFORM_ADMIN_PERMISSIONS = new Set(['users:manage', 'roles:manage', 'sso:manage', 'logs:view', 'loginActivity:view'])
const FLOWOPS_ADMIN_EXCLUDED_PERMISSIONS = new Set(['workspace:delete', ...FLOWOPS_PLATFORM_ADMIN_PERMISSIONS])

const FLOWOPS_MEMBER_PERMISSION_ALLOWLIST = [
    'chatflows:view',
    'chatflows:create',
    'chatflows:update',
    'chatflows:duplicate',
    'chatflows:delete',
    'chatflows:export',
    'chatflows:import',
    'chatflows:config',
    'agentflows:view',
    'agentflows:create',
    'agentflows:update',
    'agentflows:duplicate',
    'agentflows:delete',
    'agentflows:export',
    'agentflows:import',
    'agentflows:config',
    'tools:view',
    'tools:create',
    'tools:update',
    'tools:delete',
    'tools:export',
    'assistants:view',
    'assistants:create',
    'assistants:update',
    'assistants:delete',
    'documentStores:view',
    'documentStores:create',
    'documentStores:update',
    'documentStores:delete',
    'documentStores:add-loader',
    'documentStores:delete-loader',
    'documentStores:preview-process',
    'documentStores:upsert-config',
    'variables:view',
    'variables:create',
    'variables:update',
    'variables:delete',
    'templates:marketplace',
    'templates:custom',
    'templates:custom-delete',
    'templates:toolexport',
    'templates:flowexport',
    'executions:view',
    'executions:delete'
]

const FLOWOPS_VIEWER_PERMISSION_ALLOWLIST = [
    'chatflows:view',
    'agentflows:view',
    'tools:view',
    'assistants:view',
    'documentStores:view',
    'variables:view',
    'templates:marketplace',
    'templates:custom',
    'executions:view'
]

const allPermissionKeys = () =>
    Object.values(new Permissions().toJSON()).flatMap((category) => category.map((permission) => permission.key))

const validPermissionSubset = (permissions: string[]) => {
    const validPermissions = new Set(allPermissionKeys())
    return permissions.filter((permission) => validPermissions.has(permission))
}

const isFlowOpsWorkspaceRoleName = (name: string | undefined): name is FlowOpsWorkspaceRoleName =>
    FLOWOPS_WORKSPACE_ROLE_NAMES.includes(name as FlowOpsWorkspaceRoleName)

export const getFlowOpsWorkspaceRolePermissions = (roleName: string): string[] => {
    const permissions = allPermissionKeys()
    switch (roleName) {
        case GeneralRole.OWNER:
            return permissions.filter((permission) => !FLOWOPS_PLATFORM_ADMIN_PERMISSIONS.has(permission))
        case GeneralRole.ADMIN:
            return permissions.filter((permission) => !FLOWOPS_ADMIN_EXCLUDED_PERMISSIONS.has(permission))
        case GeneralRole.MEMBER:
            return validPermissionSubset(FLOWOPS_MEMBER_PERMISSION_ALLOWLIST)
        case GeneralRole.VIEWER:
            return validPermissionSubset(FLOWOPS_VIEWER_PERMISSION_ALLOWLIST)
        default:
            return []
    }
}

export class RoleService {
    private dataSource: DataSource
    private userService: UserService
    private organizationService: OrganizationService

    constructor() {
        const appServer = getRunningExpressApp()
        this.dataSource = appServer.AppDataSource
        this.userService = new UserService()
        this.organizationService = new OrganizationService()
    }

    public validateRoleId(id: string | undefined) {
        if (isInvalidUUID(id)) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, RoleErrorMessage.INVALID_ROLE_ID)
    }

    public async readRoleById(id: string | undefined, queryRunner: QueryRunner) {
        this.validateRoleId(id)
        return await queryRunner.manager.findOneBy(Role, { id })
    }

    public validateRoleName(name: string | undefined) {
        if (isInvalidName(name)) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, RoleErrorMessage.INVALID_ROLE_NAME)
    }

    public async readRoleByOrganizationId(organizationId: string | undefined, queryRunner: QueryRunner) {
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner)
        if (!organization) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, OrganizationErrorMessage.ORGANIZATION_NOT_FOUND)

        const roles = await this.ensurePresetWorkspaceRoles(organization.id, queryRunner)

        return await Promise.all(
            roles.map(async (role) => {
                const workspaceUser = await queryRunner.manager.findBy(WorkspaceUser, { roleId: role.id })
                const userCount = workspaceUser.length
                return { ...role, userCount } as Role & { userCount: number }
            })
        )
    }

    public async readRoleByRoleIdOrganizationId(id: string | undefined, organizationId: string | undefined, queryRunner: QueryRunner) {
        this.validateRoleId(id)
        const organization = await this.organizationService.readOrganizationById(organizationId, queryRunner)
        if (!organization) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, OrganizationErrorMessage.ORGANIZATION_NOT_FOUND)

        return await queryRunner.manager.findOneBy(Role, { id, organizationId })
    }

    public async readAssignableWorkspaceRoleByIdOrganizationId(
        id: string | undefined,
        organizationId: string | undefined,
        queryRunner: QueryRunner
    ) {
        const role = await this.readRoleByRoleIdOrganizationId(id, organizationId, queryRunner)
        if (!role || !isFlowOpsWorkspaceRoleName(role.name)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, RoleErrorMessage.CUSTOM_ROLES_DISABLED)
        }
        return role
    }

    public async readPresetWorkspaceRoleByName(
        name: FlowOpsWorkspaceRoleName,
        organizationId: string | undefined,
        queryRunner: QueryRunner
    ) {
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, OrganizationErrorMessage.ORGANIZATION_NOT_FOUND)
        const roles = await this.ensurePresetWorkspaceRoles(organizationId, queryRunner)
        const role = roles.find((workspaceRole) => workspaceRole.name === name)
        if (!role) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)
        return role
    }

    public async readGeneralRoleByName(name: string | undefined, queryRunner: QueryRunner) {
        this.validateRoleName(name)
        const generalRole = await queryRunner.manager.findOneBy(Role, { name, organizationId: IsNull() })
        if (!generalRole) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)
        return generalRole
    }

    public async readRoleIsGeneral(id: string | undefined, queryRunner: QueryRunner) {
        this.validateRoleId(id)
        return await queryRunner.manager.findOneBy(Role, { id, organizationId: IsNull() })
    }

    public async readRoleByGeneral(queryRunner: QueryRunner) {
        const generalRoles = await queryRunner.manager.find(Role, { where: { organizationId: IsNull() } })
        if (generalRoles.length <= 0) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)
        return generalRoles
    }

    public async readRole(queryRunner: QueryRunner) {
        return await queryRunner.manager.find(Role)
    }

    public async saveRole(data: Partial<Role>, queryRunner: QueryRunner) {
        return await queryRunner.manager.save(Role, data)
    }

    public async ensurePresetWorkspaceRoles(organizationId: string, queryRunner: QueryRunner) {
        const existingRoles = await queryRunner.manager.findBy(Role, { organizationId })
        const existingByName = new Map(
            existingRoles
                .filter((role) => isFlowOpsWorkspaceRoleName(role.name))
                .map((role) => [role.name as FlowOpsWorkspaceRoleName, role])
        )
        const roles: Role[] = []

        for (const roleName of FLOWOPS_WORKSPACE_ROLE_NAMES) {
            const permissions = JSON.stringify(getFlowOpsWorkspaceRolePermissions(roleName))
            const description = FLOWOPS_WORKSPACE_ROLE_DESCRIPTIONS[roleName]
            const existingRole = existingByName.get(roleName)

            if (!existingRole) {
                const role = queryRunner.manager.create(Role, {
                    organizationId,
                    name: roleName,
                    description,
                    permissions
                })
                roles.push(await this.saveRole(role, queryRunner))
                continue
            }

            if (existingRole.description !== description || existingRole.permissions !== permissions) {
                roles.push(await this.saveRole({ ...existingRole, description, permissions }, queryRunner))
                continue
            }

            roles.push(existingRole)
        }

        return roles
    }

    private assertRoleMutationAllowed(role?: Partial<Role>) {
        if (!role || !isFlowOpsWorkspaceRoleName(role.name)) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, RoleErrorMessage.CUSTOM_ROLES_DISABLED)
        }
        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, RoleErrorMessage.PRESET_ROLES_READ_ONLY)
    }

    public async createRole(data: Partial<Role>) {
        this.assertRoleMutationAllowed(data)

        const queryRunner = this.dataSource.createQueryRunner()
        try {
            await queryRunner.connect()

            const user = await this.userService.readUserById(data.createdBy, queryRunner)
            if (!user) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
            const organization = await this.organizationService.readOrganizationById(data.organizationId, queryRunner)
            if (!organization) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, OrganizationErrorMessage.ORGANIZATION_NOT_FOUND)
            this.validateRoleName(data.name)
            if (!data.permissions) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, RoleErrorMessage.INVALID_ROLE_PERMISSIONS)
            data.updatedBy = data.createdBy

            let newRole = queryRunner.manager.create(Role, data)
            await queryRunner.startTransaction()
            newRole = await this.saveRole(newRole, queryRunner)
            await queryRunner.commitTransaction()
            return newRole
        } catch (error) {
            if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction()
            throw error
        } finally {
            if (!queryRunner.isReleased) await queryRunner.release()
        }
    }

    public async updateRole(newRole: Partial<Role>) {
        const queryRunner = this.dataSource.createQueryRunner()
        try {
            await queryRunner.connect()

            const oldRole = await this.readRoleById(newRole.id, queryRunner)
            if (!oldRole) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)
            this.assertRoleMutationAllowed(oldRole)
            const user = await this.userService.readUserById(newRole.updatedBy, queryRunner)
            if (!user) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, UserErrorMessage.USER_NOT_FOUND)
            if (newRole.name) this.validateRoleName(newRole.name)
            newRole.organizationId = oldRole.organizationId
            newRole.createdBy = oldRole.createdBy

            let updateRole = queryRunner.manager.merge(Role, oldRole, newRole)
            await queryRunner.startTransaction()
            updateRole = await this.saveRole(updateRole, queryRunner)
            await queryRunner.commitTransaction()
            return updateRole
        } catch (error) {
            if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction()
            throw error
        } finally {
            if (!queryRunner.isReleased) await queryRunner.release()
        }
    }

    public async deleteRole(organizationId: string | undefined, roleId: string | undefined) {
        const queryRunner = this.dataSource.createQueryRunner()
        try {
            await queryRunner.connect()

            const role = await this.readRoleByRoleIdOrganizationId(roleId, organizationId, queryRunner)
            if (!role) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, RoleErrorMessage.ROLE_NOT_FOUND)
            this.assertRoleMutationAllowed(role)

            await queryRunner.startTransaction()

            await queryRunner.manager.delete(WorkspaceUser, { roleId })
            await queryRunner.manager.delete(Role, { id: roleId })

            await queryRunner.commitTransaction()

            return { message: GeneralSuccessMessage.DELETED }
        } catch (error) {
            if (queryRunner.isTransactionActive) await queryRunner.rollbackTransaction()
            throw error
        } finally {
            if (!queryRunner.isReleased) await queryRunner.release()
        }
    }
}
