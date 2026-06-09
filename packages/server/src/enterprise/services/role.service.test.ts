import { describe, expect, it, jest, beforeEach } from '@jest/globals'

const mockAppServer = {
    AppDataSource: {
        createQueryRunner: jest.fn()
    },
    telemetry: {},
    identityManager: {
        isOpenSource: jest.fn(() => true)
    }
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => mockAppServer)
}))

jest.mock('./organization.service', () => ({
    OrganizationErrorMessage: {
        ORGANIZATION_NOT_FOUND: 'Organization Not Found'
    },
    OrganizationService: jest.fn().mockImplementation(() => ({
        readOrganizationById: jest.fn(async (id: string | undefined) => (id ? { id } : null))
    }))
}))

jest.mock('./user.service', () => ({
    UserErrorMessage: {
        USER_NOT_FOUND: 'User Not Found'
    },
    UserService: jest.fn().mockImplementation(() => ({
        readUserById: jest.fn(async (id: string | undefined) => (id ? { id } : null))
    }))
}))

jest.mock('typeorm', () => ({
    ...(jest.requireActual('typeorm') as object),
    IsNull: jest.fn(() => ({ operator: 'isNull' }))
}))

import { GeneralRole, Role } from '../database/entities/role.entity'
import { WorkspaceUser } from '../database/entities/workspace-user.entity'
import { FLOWOPS_WORKSPACE_ROLE_NAMES, RoleErrorMessage, RoleService, getFlowOpsWorkspaceRolePermissions } from './role.service'

describe('RoleService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockAppServer.identityManager.isOpenSource.mockReturnValue(true)
    })

    it('seeds the four FlowOps workspace roles when an organization has no assignable roles', async () => {
        const organizationId = '00000000-0000-4000-8000-000000000001'
        const savedRoles: Role[] = []

        const manager = {
            findOneBy: jest.fn(async () => null),
            findBy: jest.fn(async (entity: unknown) => {
                if (entity === Role) return []
                if (entity === WorkspaceUser) return []
                return []
            }),
            create: jest.fn((_entity: unknown, data: unknown) => data),
            save: jest.fn(async (_entity: unknown, data: Partial<Role>) => {
                const saved = { id: `role-${savedRoles.length + 1}`, ...data } as Role
                savedRoles.push(saved)
                return saved
            })
        }
        const queryRunner = { manager }

        const roles = await new RoleService().readRoleByOrganizationId(organizationId, queryRunner as any)

        expect(manager.save).toHaveBeenCalledTimes(4)
        expect(roles.map((role) => role.name)).toEqual(FLOWOPS_WORKSPACE_ROLE_NAMES)
        expect(roles).toEqual(
            FLOWOPS_WORKSPACE_ROLE_NAMES.map((roleName) =>
                expect.objectContaining({
                    organizationId,
                    name: roleName,
                    userCount: 0
                })
            )
        )
    })

    it('keeps workspace roles away from platform management permissions unless the user is the platform owner', () => {
        const ownerPermissions = getFlowOpsWorkspaceRolePermissions(GeneralRole.OWNER)
        const adminPermissions = getFlowOpsWorkspaceRolePermissions(GeneralRole.ADMIN)
        const memberPermissions = getFlowOpsWorkspaceRolePermissions(GeneralRole.MEMBER)
        const viewerPermissions = getFlowOpsWorkspaceRolePermissions(GeneralRole.VIEWER)
        const platformPermissions = ['users:manage', 'roles:manage', 'sso:manage', 'logs:view', 'loginActivity:view']

        expect(ownerPermissions).toEqual(expect.arrayContaining(['workspace:delete', 'workspace:add-user', 'credentials:view']))
        expect(adminPermissions).toEqual(expect.arrayContaining(['workspace:add-user', 'credentials:view', 'apikeys:view']))
        expect(adminPermissions).not.toContain('workspace:delete')
        for (const permission of platformPermissions) {
            expect(ownerPermissions).not.toContain(permission)
            expect(adminPermissions).not.toContain(permission)
        }
        expect(memberPermissions).toEqual(expect.arrayContaining(['chatflows:create', 'agentflows:update', 'documentStores:upsert-config']))
        for (const permission of ['credentials:view', 'apikeys:view', 'workspace:add-user', ...platformPermissions]) {
            expect(memberPermissions).not.toContain(permission)
        }
        expect(viewerPermissions).toEqual(expect.arrayContaining(['chatflows:view', 'agentflows:view', 'documentStores:view']))
        for (const permission of ['chatflows:create', 'credentials:view', 'apikeys:view', 'workspace:add-user', ...platformPermissions]) {
            expect(viewerPermissions).not.toContain(permission)
        }
    })

    it('rejects direct custom role creation even when the caller has roles:manage', async () => {
        const queryRunner = {
            connect: jest.fn(),
            startTransaction: jest.fn(),
            commitTransaction: jest.fn(),
            rollbackTransaction: jest.fn(),
            release: jest.fn(),
            manager: {
                findOneBy: jest.fn(async () => null)
            }
        }
        mockAppServer.AppDataSource.createQueryRunner.mockReturnValue(queryRunner)

        await expect(
            new RoleService().createRole({
                name: 'custom-operator',
                description: 'not allowed in simplified permissions',
                permissions: '["chatflows:view"]',
                organizationId: 'org-1',
                createdBy: 'user-1'
            })
        ).rejects.toMatchObject({ message: RoleErrorMessage.CUSTOM_ROLES_DISABLED })
        expect(queryRunner.startTransaction).not.toHaveBeenCalled()
    })

    it('rejects role ids that are not one of the four assignable workspace roles', async () => {
        const customRoleId = '00000000-0000-4000-8000-000000000010'
        const queryRunner = {
            manager: {
                findOneBy: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
                    if (entity === Role && where.id === customRoleId) {
                        return {
                            id: customRoleId,
                            organizationId: 'org-1',
                            name: 'custom-operator',
                            permissions: '["chatflows:view"]'
                        }
                    }
                    return null
                })
            }
        }

        await expect(
            new RoleService().readAssignableWorkspaceRoleByIdOrganizationId(customRoleId, 'org-1', queryRunner as any)
        ).rejects.toMatchObject({
            message: RoleErrorMessage.CUSTOM_ROLES_DISABLED
        })
    })
})
