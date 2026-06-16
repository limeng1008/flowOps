import { Request } from 'express'
import { isSelfIamMode } from './provider'
import {
    getActiveWorkspaceIdForRequest as selfGetActiveWorkspaceIdForRequest,
    getWorkspaceSearchOptions as selfGetWorkspaceSearchOptions,
    getWorkspaceSearchOptionsFromReq as selfGetWorkspaceSearchOptionsFromReq
} from './self/workspace/query'

export type WorkspaceSearchOptions = {
    workspaceId?: string
}

type WorkspaceQuery = (workspaceId?: string) => WorkspaceSearchOptions
type WorkspaceReqQuery = (req: Request) => WorkspaceSearchOptions
type ActiveWorkspaceQuery = (req: Request) => string
type EnterpriseControllerServiceUtilsModule = {
    getWorkspaceSearchOptions: WorkspaceQuery
    getWorkspaceSearchOptionsFromReq: WorkspaceReqQuery
}
type EnterpriseTenantRequestGuardsModule = {
    getActiveWorkspaceIdForRequest: ActiveWorkspaceQuery
}

const getEnterpriseControllerServiceUtils = (): EnterpriseControllerServiceUtilsModule => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/utils/ControllerServiceUtils') as EnterpriseControllerServiceUtilsModule
}

const getEnterpriseTenantRequestGuards = (): EnterpriseTenantRequestGuardsModule => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/utils/tenantRequestGuards') as EnterpriseTenantRequestGuardsModule
}

export const getWorkspaceSearchOptions = (workspaceId?: string): WorkspaceSearchOptions => {
    if (isSelfIamMode()) return selfGetWorkspaceSearchOptions(workspaceId)
    return getEnterpriseControllerServiceUtils().getWorkspaceSearchOptions(workspaceId)
}

export const getWorkspaceSearchOptionsFromReq = (req: Request): WorkspaceSearchOptions => {
    if (isSelfIamMode()) return selfGetWorkspaceSearchOptionsFromReq(req)
    return getEnterpriseControllerServiceUtils().getWorkspaceSearchOptionsFromReq(req)
}

export const getActiveWorkspaceIdForRequest = (req: Request): string => {
    if (isSelfIamMode()) return selfGetActiveWorkspaceIdForRequest(req)
    return getEnterpriseTenantRequestGuards().getActiveWorkspaceIdForRequest(req)
}
