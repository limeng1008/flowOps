import type { QueryRunner } from 'typeorm'
import { FlowOpsWorkspaceMember } from '../entities'

export interface WorkspaceServiceView {
    getSharedItemsForWorkspace(workspaceId: string, itemType: string): Promise<unknown[]>
}

export interface WorkspaceUserView {
    workspaceId: string
}

export interface WorkspaceUserServiceView {
    readWorkspaceUserByUserId(userId: string, queryRunner: QueryRunner): Promise<WorkspaceUserView[]>
}

export const FlowOpsWorkspaceUserErrorMessage = {
    INVALID_WORKSPACE_USER_SATUS: 'Invalid Workspace User Status',
    INVALID_WORKSPACE_USER_LASTLOGIN: 'Invalid Workspace User LastLogin',
    WORKSPACE_USER_ALREADY_EXISTS: 'Workspace User Already Exists',
    WORKSPACE_USER_NOT_FOUND: 'Workspace User Not Found'
} as const

export class FlowOpsWorkspaceService implements WorkspaceServiceView {
    async getSharedItemsForWorkspace(_workspaceId: string, _itemType: string): Promise<unknown[]> {
        return []
    }
}

export class FlowOpsWorkspaceUserService implements WorkspaceUserServiceView {
    async readWorkspaceUserByUserId(userId: string, queryRunner: QueryRunner): Promise<WorkspaceUserView[]> {
        const members = await queryRunner.manager.getRepository(FlowOpsWorkspaceMember).findBy({ userId })
        return members.map((member) => ({ workspaceId: member.workspaceId }))
    }
}
