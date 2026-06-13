import { NextFunction, Request, Response } from 'express'
import { checkAnyPermission as selfCheckAnyPermission, checkPermission as selfCheckPermission } from './self/middleware'
import { isSelfIamMode } from './provider'

type PermissionMiddleware = (req: Request, res: Response, next: NextFunction) => void
type PermissionFactory = (permission: string) => PermissionMiddleware

const getEnterprisePermissionCheck = () => {
    // P3 惰化:self 轨不加载 enterprise。
    const enterprisePermissionCheck = require('../enterprise/rbac/PermissionCheck') as Record<string, unknown>
    return {
        // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
        checkPermission: enterprisePermissionCheck.checkPermission as unknown as PermissionFactory,
        // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
        checkAnyPermission: enterprisePermissionCheck.checkAnyPermission as unknown as PermissionFactory
    }
}

export const checkPermission = (permission: string): PermissionMiddleware => {
    if (isSelfIamMode()) return selfCheckPermission(permission)
    return getEnterprisePermissionCheck().checkPermission(permission)
}

export const checkAnyPermission = (permissions: string): PermissionMiddleware => {
    if (isSelfIamMode()) return selfCheckAnyPermission(permissions)
    return getEnterprisePermissionCheck().checkAnyPermission(permissions)
}
