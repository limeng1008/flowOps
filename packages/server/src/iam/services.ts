import type { QueryRunner } from 'typeorm'
import { isSelfIamMode } from './provider'
import { FlowOpsWorkspaceMember } from './self/entities'

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

// self IAM 是单组织,没有跨工作区共享。self 轨的 DataSource 不注册 enterprise 的 `WorkspaceShared`
// 实体,旧代码无条件 new enterprise WorkspaceService,会让 credentials / marketplaces 调
// getSharedItemsForWorkspace 时报 `No metadata for "WorkspaceShared"`(500);出货构建剪除 enterprise 后
// 这里的 require 还会直接崩。self 模式改用本地 stub:无共享 → 返回空集,且不依赖 enterprise。
class SelfWorkspaceService implements WorkspaceServiceView {
    async getSharedItemsForWorkspace(): Promise<unknown[]> {
        return []
    }
}

export const WorkspaceService = class {
    constructor(...args: any[]) {
        if (isSelfIamMode()) return new SelfWorkspaceService()
        return new (loadEnterpriseWorkspaceService())(...args)
    }
} as EnterpriseConstructor<WorkspaceServiceView>

// self IAM:从 flowops_workspace_member 读用户的工作区成员关系(返回值会被 chatflows 鉴权使用,
// 不能像 WorkspaceService 那样直接 no-op)。避免无条件 new enterprise WorkspaceUserService 去查
// self 轨未注册的 enterprise `WorkspaceUsers` 实体(否则 No metadata 500 / 出货构建 require 崩)。
class SelfWorkspaceUserService implements WorkspaceUserServiceView {
    async readWorkspaceUserByUserId(userId: string, queryRunner: QueryRunner): Promise<WorkspaceUserView[]> {
        const members = await queryRunner.manager.getRepository(FlowOpsWorkspaceMember).findBy({ userId })
        return members.map((member) => ({ workspaceId: member.workspaceId }))
    }
}

export const WorkspaceUserService = class {
    constructor(...args: any[]) {
        if (isSelfIamMode()) return new SelfWorkspaceUserService()
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
