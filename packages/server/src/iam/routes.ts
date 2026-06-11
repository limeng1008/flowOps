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

export const accountRouter = isSelfIamMode() ? selfAccountRouter : enterpriseAccountRouter
export const authRouter = isSelfIamMode() ? selfAuthRouter : enterpriseAuthRouter
export const loginMethodRouter = isSelfIamMode() ? selfLoginMethodRouter : enterpriseLoginMethodRouter

export const auditRouter = enterpriseAuditRouter
export const organizationUserRoute = enterpriseOrganizationUserRoute
export const organizationRouter = enterpriseOrganizationRouter
export const roleRouter = enterpriseRoleRouter
export const userRouter = enterpriseUserRouter
export const workspaceUserRouter = enterpriseWorkspaceUserRouter
export const workspaceRouter = enterpriseWorkspaceRouter
