import { Request } from 'express'
import { isSelfIamMode } from './provider'
import {
    getActiveWorkspaceIdForRequest as selfGetActiveWorkspaceIdForRequest,
    getWorkspaceSearchOptions as selfGetWorkspaceSearchOptions,
    getWorkspaceSearchOptionsFromReq as selfGetWorkspaceSearchOptionsFromReq
} from './self/workspace/query'

type WorkspaceQuery = (workspaceId?: string) => Record<string, unknown>
type WorkspaceReqQuery = (req: Request) => Record<string, unknown>
type ActiveWorkspaceQuery = (req: Request) => string

const getEnterpriseControllerServiceUtils = () => {
    // P3 惰化:self 轨不加载 enterprise。
    const enterpriseControllerServiceUtils = require('../enterprise/utils/ControllerServiceUtils') as Record<string, unknown>
    return {
        getWorkspaceSearchOptions: enterpriseControllerServiceUtils.getWorkspaceSearchOptions as WorkspaceQuery,
        getWorkspaceSearchOptionsFromReq: enterpriseControllerServiceUtils.getWorkspaceSearchOptionsFromReq as WorkspaceReqQuery
    }
}

const getEnterpriseTenantRequestGuards = () => {
    // P3 惰化:self 轨不加载 enterprise。
    const enterpriseTenantRequestGuards = require('../enterprise/utils/tenantRequestGuards') as Record<string, unknown>
    return {
        getActiveWorkspaceIdForRequest: enterpriseTenantRequestGuards.getActiveWorkspaceIdForRequest as ActiveWorkspaceQuery
    }
}

export const getWorkspaceSearchOptions = (workspaceId?: string): Record<string, unknown> => {
    if (isSelfIamMode()) return selfGetWorkspaceSearchOptions(workspaceId)
    return getEnterpriseControllerServiceUtils().getWorkspaceSearchOptions(workspaceId)
}

export const getWorkspaceSearchOptionsFromReq = (req: Request): Record<string, unknown> => {
    if (isSelfIamMode()) return selfGetWorkspaceSearchOptionsFromReq(req)
    return getEnterpriseControllerServiceUtils().getWorkspaceSearchOptionsFromReq(req)
}

export const getActiveWorkspaceIdForRequest = (req: Request): string => {
    if (isSelfIamMode()) return selfGetActiveWorkspaceIdForRequest(req)
    return getEnterpriseTenantRequestGuards().getActiveWorkspaceIdForRequest(req)
}
