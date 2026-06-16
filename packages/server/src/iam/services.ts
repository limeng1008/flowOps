import { isSelfIamMode } from './provider'
import {
    FlowOpsWorkspaceService,
    FlowOpsWorkspaceUserErrorMessage,
    FlowOpsWorkspaceUserService,
    type WorkspaceServiceView,
    type WorkspaceUserServiceView
} from './self/workspace/services'

type EnterpriseConstructor<T> = new (...args: any[]) => T

type EnterpriseWorkspaceUserServiceModule = {
    WorkspaceUserErrorMessage: Record<string, string>
    WorkspaceUserService: EnterpriseConstructor<WorkspaceUserServiceView>
}

const loadEnterpriseWorkspaceService = (): EnterpriseConstructor<WorkspaceServiceView> => {
    return (require('../enterprise/services/workspace.service') as { WorkspaceService: EnterpriseConstructor<WorkspaceServiceView> })
        .WorkspaceService
}

const loadEnterpriseWorkspaceUserService = (): EnterpriseWorkspaceUserServiceModule =>
    require('../enterprise/services/workspace-user.service') as EnterpriseWorkspaceUserServiceModule

export const WorkspaceService = class {
    constructor(...args: any[]) {
        if (isSelfIamMode()) return new FlowOpsWorkspaceService()
        return new (loadEnterpriseWorkspaceService())(...args)
    }
} as EnterpriseConstructor<WorkspaceServiceView>

export const WorkspaceUserService = class {
    constructor(...args: any[]) {
        if (isSelfIamMode()) return new FlowOpsWorkspaceUserService()
        return new (loadEnterpriseWorkspaceUserService().WorkspaceUserService)(...args)
    }
} as EnterpriseConstructor<WorkspaceUserServiceView>

const EnterpriseWorkspaceUserErrorMessage = new Proxy(
    {},
    {
        get(_target, property: string | symbol) {
            if (typeof property !== 'string') return undefined
            return loadEnterpriseWorkspaceUserService().WorkspaceUserErrorMessage[property]
        }
    }
) as Record<string, string>

export const WorkspaceUserErrorMessage = isSelfIamMode() ? FlowOpsWorkspaceUserErrorMessage : EnterpriseWorkspaceUserErrorMessage
