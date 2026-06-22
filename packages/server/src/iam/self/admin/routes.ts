import { NextFunction, Response, Router } from 'express'
import { getDataSource } from '../../../DataSource'
import { checkAnyPermission, checkPermission } from '../middleware'
import { createSelfAuthTokens } from '../auth/service'
import { FlowOpsAuthError, FlowOpsLoggedInUser } from '../auth/types'
import { SELF_ACCESS_TOKEN_COOKIE, SELF_REFRESH_TOKEN_COOKIE } from '../secrets'
import { FlowOpsAdminService } from './service'
import { FlowOpsAuthenticatedAuditActor, toAuthenticatedAuditActor } from '../audit/context'

const roleRouter = Router()
const workspaceRouter = Router()
const workspaceUserRouter = Router()
const userRouter = Router()
const organizationUserRoute = Router()
const organizationRouter = Router()

const cookieOptions = (maxAge: number) => ({
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.SECURE_COOKIES === 'true',
    path: '/',
    maxAge
})

const service = () => new FlowOpsAdminService(getDataSource())

const requireAuditActor = (req: Parameters<typeof toAuthenticatedAuditActor>[0]): FlowOpsAuthenticatedAuditActor => {
    const actor = toAuthenticatedAuditActor(req)
    if (!actor) throw new FlowOpsAuthError(401, 'Unauthorized')
    return actor
}

const sendError = (error: unknown, res: Response, next: NextFunction) => {
    if (error instanceof FlowOpsAuthError) return res.status(error.statusCode).json({ message: error.message })
    next(error)
}

const issueCookies = (res: Response, user: { id: string; activeWorkspaceId?: string }) => {
    const tokens = createSelfAuthTokens(user)
    res.cookie(SELF_ACCESS_TOKEN_COOKIE, tokens.accessToken, cookieOptions(tokens.accessMaxAgeMs))
    res.cookie(SELF_REFRESH_TOKEN_COOKIE, tokens.refreshToken, cookieOptions(tokens.refreshMaxAgeMs))
    return tokens
}

roleRouter.get('/', checkPermission('roles:manage'), async (req, res, next) => {
    try {
        res.json(await service().listRoles())
    } catch (error) {
        sendError(error, res, next)
    }
})
roleRouter.post('/', checkPermission('roles:manage'), async (req, res, next) => {
    try {
        res.json(await service().createRole(req.body, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
roleRouter.put('/', checkPermission('roles:manage'), async (req, res, next) => {
    try {
        res.json(await service().updateRole(req.body, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
roleRouter.delete('/', checkPermission('roles:manage'), async (req, res, next) => {
    try {
        res.json(await service().deleteRole(req.query.id as string, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})

workspaceRouter.get('/', checkPermission('workspace:view'), async (req, res, next) => {
    try {
        const id = req.query.id as string | undefined
        if (id) return res.json(await service().getWorkspaceById(id))
        res.json(await service().listWorkspaces(req.query.organizationId as string | undefined))
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceRouter.post('/', checkPermission('workspace:create'), async (req, res, next) => {
    try {
        res.json(await service().createWorkspace(req.body, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceRouter.put('/', checkPermission('workspace:update'), async (req, res, next) => {
    try {
        res.json(await service().updateWorkspace(req.body, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceRouter.delete('/:id', checkPermission('workspace:delete'), async (req, res, next) => {
    try {
        res.json(await service().deleteWorkspace(req.params.id, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
// 切换到「自己已是成员」的工作区无需 workspace:view(那是管理员权限);
// 授权由 switchWorkspace 内部的成员关系校验负责(非成员 → 403)。任何登录用户都能在自己的工作区间切换。
workspaceRouter.post('/switch', async (req, res, next) => {
    try {
        const loggedInUser = await service().switchWorkspace(req.query.id as string, req.user as any as FlowOpsLoggedInUser)
        const tokens = issueCookies(res, loggedInUser)
        res.json({ ...loggedInUser, token: tokens.accessToken })
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceRouter.post('/link-users/:id', checkPermission('workspace:add-user'), async (_req, res) => {
    res.json({ success: true })
})
workspaceRouter.post('/unlink-users/:id', checkPermission('workspace:unlink-user'), async (req, res, next) => {
    try {
        const userIds = (req.body?.userIds ?? req.body?.users ?? []) as string[]
        const actor = requireAuditActor(req)
        for (const userId of userIds) await service().deleteWorkspaceUser(req.params.id, userId, actor)
        res.json({ success: true })
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceRouter.get('/shared/:id', (_req, res) => res.json([]))
workspaceRouter.post('/shared/:id', (_req, res) => res.json([]))

workspaceUserRouter.get('/', checkAnyPermission('workspace:view,users:manage,roles:manage'), async (req, res, next) => {
    try {
        if (req.query.userId && req.query.workspaceId) {
            const rows = await service().listWorkspaceUsers(req.query.workspaceId as string)
            return res.json(rows.find((row) => row.userId === req.query.userId) ?? null)
        }
        if (req.query.workspaceId) return res.json(await service().listWorkspaceUsers(req.query.workspaceId as string))
        if (req.query.roleId) return res.json(await service().listUsersByRoleId(req.query.roleId as string))
        if (req.query.userId) return res.json(await service().listWorkspacesByUserId(req.query.userId as string))
        res.json([])
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceUserRouter.put('/', checkPermission('workspace:add-user'), async (req, res, next) => {
    try {
        res.json(await service().updateWorkspaceUserRole(req.body, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
workspaceUserRouter.delete('/', checkPermission('workspace:unlink-user'), async (req, res, next) => {
    try {
        res.json(await service().deleteWorkspaceUser(req.query.workspaceId as string, req.query.userId as string, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})

organizationUserRoute.get('/', checkPermission('users:manage'), async (req, res, next) => {
    try {
        const organizationId = req.query.organizationId as string
        const userId = req.query.userId as string | undefined
        if (organizationId && userId) return res.json(await service().getOrganizationUser(organizationId, userId))
        if (organizationId) return res.json(await service().listOrganizationUsers(organizationId))
        if (userId) return res.json(await service().listWorkspacesByUserId(userId))
        res.json([])
    } catch (error) {
        sendError(error, res, next)
    }
})
organizationUserRoute.put('/', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(await service().updateOrganizationUser(req.body, requireAuditActor(req)))
    } catch (error) {
        sendError(error, res, next)
    }
})
organizationUserRoute.delete('/', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(
            await service().deleteOrganizationUser(req.query.organizationId as string, req.query.userId as string, requireAuditActor(req))
        )
    } catch (error) {
        sendError(error, res, next)
    }
})

organizationRouter.get('/', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(await service().listOrganizations(req.user as any as FlowOpsLoggedInUser))
    } catch (error) {
        sendError(error, res, next)
    }
})
organizationRouter.get('/additional-seats-quantity', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(await service().getAdditionalSeatsQuantity((req.user as any as FlowOpsLoggedInUser)?.activeOrganizationId))
    } catch (error) {
        sendError(error, res, next)
    }
})
organizationRouter.get('/customer-default-source', checkPermission('users:manage'), (_req, res) => {
    res.json({ invoice_settings: { default_payment_method: null } })
})
organizationRouter.get('/additional-seats-proration', checkPermission('users:manage'), (_req, res) => {
    res.json({ currency: 'usd', additionalSeatsProratedAmount: 0, prorationDate: null })
})
organizationRouter.post('/update-additional-seats', checkPermission('users:manage'), (_req, res) => {
    res.json({ success: true })
})
organizationRouter.get('/plan-proration', checkPermission('users:manage'), (_req, res) => {
    res.json({ currency: 'usd', additionalSeatsProratedAmount: 0, prorationDate: null })
})
organizationRouter.post('/update-subscription-plan', checkPermission('users:manage'), (_req, res) => {
    res.json({ success: true })
})
organizationRouter.get('/get-current-usage', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(await service().getCurrentUsage((req.user as any as FlowOpsLoggedInUser)?.activeOrganizationId))
    } catch (error) {
        sendError(error, res, next)
    }
})

userRouter.get('/', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(await service().getUserById(req.query.id as string))
    } catch (error) {
        sendError(error, res, next)
    }
})
userRouter.put('/', checkPermission('users:manage'), async (req, res, next) => {
    try {
        res.json(await service().updateUser(req.body))
    } catch (error) {
        sendError(error, res, next)
    }
})

export { organizationRouter, organizationUserRoute, roleRouter, userRouter, workspaceRouter, workspaceUserRouter }
