import { getActiveWorkspaceIdForRequest, getWorkspaceSearchOptions, getWorkspaceSearchOptionsFromReq } from './self/workspace/query'

export type WorkspaceSearchOptions = {
    workspaceId?: string
}

export { getActiveWorkspaceIdForRequest, getWorkspaceSearchOptions, getWorkspaceSearchOptionsFromReq }
