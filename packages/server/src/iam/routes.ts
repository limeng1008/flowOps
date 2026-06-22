import { accountRouter, authRouter, loginMethodRouter } from './self/auth/routes'
import { auditRouter } from './self/audit/routes'
import {
    organizationRouter,
    organizationUserRoute,
    roleRouter,
    userRouter,
    workspaceRouter,
    workspaceUserRouter
} from './self/admin/routes'

export { accountRouter, authRouter, loginMethodRouter }
export { auditRouter, organizationRouter, organizationUserRoute, roleRouter, userRouter, workspaceRouter, workspaceUserRouter }
