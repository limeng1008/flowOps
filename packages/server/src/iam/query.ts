import { Request } from 'express'
import {
    getWorkspaceSearchOptions as enterpriseGetWorkspaceSearchOptions,
    getWorkspaceSearchOptionsFromReq as enterpriseGetWorkspaceSearchOptionsFromReq
} from '../enterprise/utils/ControllerServiceUtils'
import { getActiveWorkspaceIdForRequest as enterpriseGetActiveWorkspaceIdForRequest } from '../enterprise/utils/tenantRequestGuards'
import { isSelfIamMode } from './provider'
import {
    getActiveWorkspaceIdForRequest as selfGetActiveWorkspaceIdForRequest,
    getWorkspaceSearchOptions as selfGetWorkspaceSearchOptions,
    getWorkspaceSearchOptionsFromReq as selfGetWorkspaceSearchOptionsFromReq
} from './self/workspace/query'

export const getWorkspaceSearchOptions = (workspaceId?: string): Record<string, unknown> => {
    if (isSelfIamMode()) return selfGetWorkspaceSearchOptions(workspaceId)
    return enterpriseGetWorkspaceSearchOptions(workspaceId)
}

export const getWorkspaceSearchOptionsFromReq = (req: Request): Record<string, unknown> => {
    if (isSelfIamMode()) return selfGetWorkspaceSearchOptionsFromReq(req)
    return enterpriseGetWorkspaceSearchOptionsFromReq(req)
}

export const getActiveWorkspaceIdForRequest = (req: Request): string => {
    if (isSelfIamMode()) return selfGetActiveWorkspaceIdForRequest(req)
    return enterpriseGetActiveWorkspaceIdForRequest(req)
}
