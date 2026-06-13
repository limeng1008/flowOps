import type { QueryRunner } from 'typeorm'

type EnterpriseConstructor<T> = new (...args: any[]) => T

interface WorkspaceServiceView {
    getSharedItemsForWorkspace(workspaceId: string, itemType: string): Promise<unknown[]>
}

interface WorkspaceUserView {
    workspaceId: string
}

interface WorkspaceUserServiceView {
    readWorkspaceUserByUserId(userId: string, queryRunner: QueryRunner): Promise<WorkspaceUserView[]>
}

const loadEnterpriseWorkspaceService = (): EnterpriseConstructor<WorkspaceServiceView> => {
    // P3 惰化:self 轨不加载 enterprise。
    return (require('../enterprise/services/workspace.service') as { WorkspaceService: EnterpriseConstructor<WorkspaceServiceView> })
        .WorkspaceService
}

const loadEnterpriseWorkspaceUserService = () => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/services/workspace-user.service') as {
        WorkspaceUserErrorMessage: Record<string, string>
        WorkspaceUserService: EnterpriseConstructor<WorkspaceUserServiceView>
    }
}

export const WorkspaceService = class {
    constructor(...args: any[]) {
        return new (loadEnterpriseWorkspaceService())(...args)
    }
} as EnterpriseConstructor<WorkspaceServiceView>

export const WorkspaceUserService = class {
    constructor(...args: any[]) {
        return new (loadEnterpriseWorkspaceUserService().WorkspaceUserService)(...args)
    }
} as EnterpriseConstructor<WorkspaceUserServiceView>

export const WorkspaceUserErrorMessage = new Proxy(
    {},
    {
        get(_target, property: string | symbol) {
            if (typeof property !== 'string') return undefined
            return loadEnterpriseWorkspaceUserService().WorkspaceUserErrorMessage[property]
        }
    }
) as Record<string, string>
