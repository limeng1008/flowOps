import {
    checkAnyPermission as enterpriseCheckAnyPermission,
    checkPermission as enterpriseCheckPermission
} from '../enterprise/rbac/PermissionCheck'
import { checkAnyPermission as selfCheckAnyPermission, checkPermission as selfCheckPermission } from './self/middleware'
import { isSelfIamMode } from './provider'

export const checkPermission = (...args: Parameters<typeof enterpriseCheckPermission>) => {
    if (isSelfIamMode()) return selfCheckPermission(...args)
    return enterpriseCheckPermission(...args)
}

export const checkAnyPermission = (...args: Parameters<typeof enterpriseCheckAnyPermission>) => {
    if (isSelfIamMode()) return selfCheckAnyPermission(...args)
    return enterpriseCheckAnyPermission(...args)
}
