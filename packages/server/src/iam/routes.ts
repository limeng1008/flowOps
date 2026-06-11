import enterpriseAccountRouter from '../enterprise/routes/account.route'
import enterpriseAuditRouter from '../enterprise/routes/audit'
import enterpriseAuthRouter from '../enterprise/routes/auth'
import enterpriseLoginMethodRouter from '../enterprise/routes/login-method.route'
import enterpriseOrganizationUserRoute from '../enterprise/routes/organization-user.route'
import enterpriseOrganizationRouter from '../enterprise/routes/organization.route'
import enterpriseRoleRouter from '../enterprise/routes/role.route'
import enterpriseUserRouter from '../enterprise/routes/user.route'
import enterpriseWorkspaceUserRouter from '../enterprise/routes/workspace-user.route'
import enterpriseWorkspaceRouter from '../enterprise/routes/workspace.route'
import { isSelfIamMode } from './provider'
import {
    accountRouter as selfAccountRouter,
    authRouter as selfAuthRouter,
    loginMethodRouter as selfLoginMethodRouter
} from './self/auth/routes'
import {
    organizationUserRoute as selfOrganizationUserRoute,
    roleRouter as selfRoleRouter,
    userRouter as selfUserRouter,
    workspaceRouter as selfWorkspaceRouter,
    workspaceUserRouter as selfWorkspaceUserRouter
} from './self/admin/routes'

export const accountRouter = isSelfIamMode() ? selfAccountRouter : enterpriseAccountRouter
export const authRouter = isSelfIamMode() ? selfAuthRouter : enterpriseAuthRouter
export const loginMethodRouter = isSelfIamMode() ? selfLoginMethodRouter : enterpriseLoginMethodRouter

export const auditRouter = enterpriseAuditRouter
export const organizationUserRoute = isSelfIamMode() ? selfOrganizationUserRoute : enterpriseOrganizationUserRoute
export const organizationRouter = enterpriseOrganizationRouter
export const roleRouter = isSelfIamMode() ? selfRoleRouter : enterpriseRoleRouter
export const userRouter = isSelfIamMode() ? selfUserRouter : enterpriseUserRouter
export const workspaceUserRouter = isSelfIamMode() ? selfWorkspaceUserRouter : enterpriseWorkspaceUserRouter
export const workspaceRouter = isSelfIamMode() ? selfWorkspaceRouter : enterpriseWorkspaceRouter
