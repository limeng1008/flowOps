import type { Router } from 'express'
import { isSelfIamMode } from './provider'
import {
    accountRouter as selfAccountRouter,
    authRouter as selfAuthRouter,
    loginMethodRouter as selfLoginMethodRouter
} from './self/auth/routes'
import {
    auditRouter as selfAuditRouter,
    organizationRouter as selfOrganizationRouter,
    organizationUserRoute as selfOrganizationUserRoute,
    roleRouter as selfRoleRouter,
    userRouter as selfUserRouter,
    workspaceRouter as selfWorkspaceRouter,
    workspaceUserRouter as selfWorkspaceUserRouter
} from './self/admin/routes'

const loadEnterpriseRouter = (path: string): Router => {
    // P3 惰化:self 轨不加载 enterprise。
    return (require(path) as { default: Router }).default
}

export const accountRouter = isSelfIamMode() ? selfAccountRouter : loadEnterpriseRouter('../enterprise/routes/account.route')
export const authRouter = isSelfIamMode() ? selfAuthRouter : loadEnterpriseRouter('../enterprise/routes/auth')
export const loginMethodRouter = isSelfIamMode() ? selfLoginMethodRouter : loadEnterpriseRouter('../enterprise/routes/login-method.route')

export const auditRouter = isSelfIamMode() ? selfAuditRouter : loadEnterpriseRouter('../enterprise/routes/audit')
export const organizationUserRoute = isSelfIamMode()
    ? selfOrganizationUserRoute
    : loadEnterpriseRouter('../enterprise/routes/organization-user.route')
export const organizationRouter = isSelfIamMode() ? selfOrganizationRouter : loadEnterpriseRouter('../enterprise/routes/organization.route')
export const roleRouter = isSelfIamMode() ? selfRoleRouter : loadEnterpriseRouter('../enterprise/routes/role.route')
export const userRouter = isSelfIamMode() ? selfUserRouter : loadEnterpriseRouter('../enterprise/routes/user.route')
export const workspaceUserRouter = isSelfIamMode()
    ? selfWorkspaceUserRouter
    : loadEnterpriseRouter('../enterprise/routes/workspace-user.route')
export const workspaceRouter = isSelfIamMode() ? selfWorkspaceRouter : loadEnterpriseRouter('../enterprise/routes/workspace.route')
