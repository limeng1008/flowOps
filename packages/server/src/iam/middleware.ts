import { NextFunction, Request, Response } from 'express'
import {
    checkAnyPermission as enterpriseCheckAnyPermission,
    checkPermission as enterpriseCheckPermission
} from '../enterprise/rbac/PermissionCheck'
import { checkAnyPermission as selfCheckAnyPermission, checkPermission as selfCheckPermission } from './self/middleware'
import { isSelfIamMode } from './provider'

type PermissionMiddleware = (req: Request, res: Response, next: NextFunction) => void
type PermissionFactory = (permission: string) => PermissionMiddleware

// 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
const bridgedEnterpriseCheckPermission = enterpriseCheckPermission as unknown as PermissionFactory
// 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
const bridgedEnterpriseCheckAnyPermission = enterpriseCheckAnyPermission as unknown as PermissionFactory

export const checkPermission = (permission: string): PermissionMiddleware => {
    if (isSelfIamMode()) return selfCheckPermission(permission)
    return bridgedEnterpriseCheckPermission(permission)
}

export const checkAnyPermission = (permissions: string): PermissionMiddleware => {
    if (isSelfIamMode()) return selfCheckAnyPermission(permissions)
    return bridgedEnterpriseCheckAnyPermission(permissions)
}
