import { describe, expect, it, jest } from '@jest/globals'

const mockAppServer = {
    AppDataSource: {},
    telemetry: {},
    identityManager: {
        isOpenSource: jest.fn(() => true)
    }
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => mockAppServer)
}))

jest.mock('typeorm', () => ({
    ...(jest.requireActual('typeorm') as object),
    IsNull: jest.fn(() => ({ operator: 'isNull' }))
}))

import { Organization } from '../database/entities/organization.entity'
import { GeneralRole, Role } from '../database/entities/role.entity'
import { WorkspaceUser } from '../database/entities/workspace-user.entity'
import { RoleService } from './role.service'

describe('RoleService', () => {
    it('creates a default local workspace member role when an open-source organization has no assignable roles', async () => {
        const organizationId = '00000000-0000-4000-8000-000000000001'
        const defaultRole = {
            id: '00000000-0000-4000-8000-000000000002',
            organizationId,
            name: GeneralRole.MEMBER,
            description: 'Can manage assigned workspaces.',
            permissions: '["chatflows:view","chatflows:create"]'
        }
        const personalWorkspaceRole = {
            id: '00000000-0000-4000-8000-000000000003',
            name: GeneralRole.PERSONAL_WORKSPACE,
            organizationId: null,
            permissions: defaultRole.permissions
        }

        const manager = {
            findOneBy: jest.fn(async (entity: unknown, where: Record<string, unknown>) => {
                if (entity === Organization && where.id === organizationId) {
                    return { id: organizationId }
                }
                if (entity === Role && where.name === GeneralRole.PERSONAL_WORKSPACE) {
                    return personalWorkspaceRole
                }
                return null
            }),
            findBy: jest.fn(async (entity: unknown) => {
                if (entity === Role) return []
                if (entity === WorkspaceUser) return []
                return []
            }),
            create: jest.fn((_entity: unknown, data: unknown) => data),
            save: jest.fn(async (_entity: unknown, data: unknown) => ({ ...defaultRole, ...(data as object) }))
        }
        const queryRunner = { manager }

        const roles = await new RoleService().readRoleByOrganizationId(organizationId, queryRunner as any)

        expect(manager.save).toHaveBeenCalledWith(
            Role,
            expect.objectContaining({
                organizationId,
                name: GeneralRole.MEMBER,
                permissions: personalWorkspaceRole.permissions
            })
        )
        expect(roles).toEqual([
            expect.objectContaining({
                organizationId,
                name: GeneralRole.MEMBER,
                userCount: 0
            })
        ])
    })
})
