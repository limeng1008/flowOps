import { beforeEach, describe, expect, it, jest } from '@jest/globals'

const readUserByIdMock = jest.fn<() => Promise<unknown>>()
const readAssignableWorkspaceRoleByIdOrganizationIdMock = jest.fn<() => Promise<unknown>>()

const mockAppServer = {
    AppDataSource: {
        createQueryRunner: jest.fn()
    }
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => mockAppServer)
}))

jest.mock('./user.service', () => ({
    UserErrorMessage: {
        USER_NOT_FOUND: 'User Not Found'
    },
    UserService: jest.fn().mockImplementation(() => ({
        readUserById: readUserByIdMock
    }))
}))

jest.mock('./workspace.service', () => ({
    WorkspaceErrorMessage: {
        WORKSPACE_NOT_FOUND: 'Workspace Not Found'
    },
    WorkspaceService: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('./organization.service', () => ({
    OrganizationErrorMessage: {
        INVALID_ORGANIZATION_ID: 'Invalid Organization Id',
        ORGANIZATION_NOT_FOUND: 'Organization Not Found'
    },
    OrganizationService: jest.fn().mockImplementation(() => ({}))
}))

jest.mock('./role.service', () => ({
    RoleErrorMessage: {
        ROLE_NOT_FOUND: 'Role Not Found'
    },
    RoleService: jest.fn().mockImplementation(() => ({
        readAssignableWorkspaceRoleByIdOrganizationId: readAssignableWorkspaceRoleByIdOrganizationIdMock
    }))
}))

import { WorkspaceUser } from '../database/entities/workspace-user.entity'
import { WorkspaceUserService } from './workspace-user.service'

describe('WorkspaceUserService', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        readUserByIdMock.mockResolvedValue({ id: '00000000-0000-4000-8000-000000000001' })
        readAssignableWorkspaceRoleByIdOrganizationIdMock.mockRejectedValue(new Error('unchanged roleId should not be revalidated'))
    })

    it('does not revalidate an unchanged legacy role when updating login metadata', async () => {
        const service = new WorkspaceUserService()
        const existingWorkspaceUser = {
            workspaceId: '00000000-0000-4000-8000-000000000010',
            userId: '00000000-0000-4000-8000-000000000001',
            roleId: '00000000-0000-1000-8000-000000000020',
            role: {
                id: '00000000-0000-1000-8000-000000000020',
                name: 'owner',
                organizationId: null
            },
            createdBy: '00000000-0000-4000-8000-000000000001'
        } as unknown as WorkspaceUser

        jest.spyOn(service, 'readWorkspaceUserByWorkspaceIdUserId').mockResolvedValue({
            workspace: {
                id: existingWorkspaceUser.workspaceId,
                organizationId: '00000000-0000-4000-8000-000000000099'
            },
            workspaceUser: existingWorkspaceUser
        } as never)

        const queryRunner = {
            manager: {
                merge: jest.fn((_entity: unknown, existing: unknown, updates: unknown) => ({
                    ...(existing as object),
                    ...(updates as object)
                })),
                save: jest.fn(async (_entity: unknown, data: unknown) => data)
            }
        }

        await expect(
            service.updateWorkspaceUser(
                {
                    workspaceId: existingWorkspaceUser.workspaceId,
                    userId: existingWorkspaceUser.userId,
                    roleId: existingWorkspaceUser.roleId,
                    status: 'active',
                    lastLogin: '2026-06-10T07:30:00.000Z',
                    updatedBy: existingWorkspaceUser.userId
                },
                queryRunner as never
            )
        ).resolves.toMatchObject({
            workspaceId: existingWorkspaceUser.workspaceId,
            userId: existingWorkspaceUser.userId,
            roleId: existingWorkspaceUser.roleId,
            lastLogin: '2026-06-10T07:30:00.000Z'
        })

        expect(readAssignableWorkspaceRoleByIdOrganizationIdMock).not.toHaveBeenCalled()
    })
})
