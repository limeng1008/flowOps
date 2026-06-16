import { NextFunction, Request, Response } from 'express'
import { checkAnyPermission as selfCheckAnyPermission, checkPermission as selfCheckPermission } from './self/middleware'
import { isSelfIamMode } from './provider'

type PermissionMiddleware = (req: Request, res: Response, next: NextFunction) => void
type PermissionFactory = (permission: string) => PermissionMiddleware
type EnterprisePermissionCheckModule = {
    checkPermission: PermissionFactory
    checkAnyPermission: PermissionFactory
}

const getEnterprisePermissionCheck = (): EnterprisePermissionCheckModule => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/rbac/PermissionCheck') as EnterprisePermissionCheckModule
}

export const checkPermission = (permission: string): PermissionMiddleware => {
    if (isSelfIamMode()) return selfCheckPermission(permission)
    return getEnterprisePermissionCheck().checkPermission(permission)
}

export const checkAnyPermission = (permissions: string): PermissionMiddleware => {
    if (isSelfIamMode()) return selfCheckAnyPermission(permissions)
    return getEnterprisePermissionCheck().checkAnyPermission(permissions)
}
