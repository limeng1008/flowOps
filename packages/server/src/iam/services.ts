import {
    FlowOpsWorkspaceService,
    FlowOpsWorkspaceUserErrorMessage,
    FlowOpsWorkspaceUserService,
    type WorkspaceServiceView,
    type WorkspaceUserServiceView
} from './self/workspace/services'

export const WorkspaceService: new () => WorkspaceServiceView = FlowOpsWorkspaceService
export const WorkspaceUserService: new () => WorkspaceUserServiceView = FlowOpsWorkspaceUserService
export const WorkspaceUserErrorMessage = FlowOpsWorkspaceUserErrorMessage
