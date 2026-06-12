import { NextFunction, Request, Response } from 'express'
import jwt from 'jsonwebtoken'
import { SELF_ACCESS_TOKEN_COOKIE } from './secrets'

const getBearerToken = (req: Request): string | undefined => {
    const authorization = req.headers.authorization
    if (!authorization?.startsWith('Bearer ')) return undefined
    return authorization.slice('Bearer '.length).trim()
}

const getSelfDataSource = () => {
    const dataSourceModule = require('../../DataSource') as { getDataSource: () => any }
    return dataSourceModule.getDataSource()
}

const getSelfAuthServiceModule = () =>
    require('./auth/service') as {
        FlowOpsAuthService: new (dataSource: any) => { getLoggedInUser: (userId: string, workspaceId?: string) => Promise<any> }
        verifySelfAccessToken: (token: string) => { sub: string; activeWorkspaceId?: string }
    }

export const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    const token = req.cookies?.[SELF_ACCESS_TOKEN_COOKIE] ?? getBearerToken(req)
    if (!token) return res.status(401).json({ message: 'Invalid or Missing token' })

    try {
        const { FlowOpsAuthService, verifySelfAccessToken } = getSelfAuthServiceModule()
        const payload = verifySelfAccessToken(token)
        req.user = (await new FlowOpsAuthService(getSelfDataSource()).getLoggedInUser(payload.sub, payload.activeWorkspaceId)) as any
        return next()
    } catch (error) {
        if (error instanceof jwt.TokenExpiredError) {
            return res.status(401).json({ message: 'Token Expired', retry: true })
        }
        return res.status(401).json({ message: 'Invalid or Missing token' })
    }
}

export const verifyTokenForBullMQDashboard = verifyToken

export const checkPermission = (permission: string) => (_req: Request, _res: Response, next: NextFunction) => {
    const req = _req as Request & { user?: { permissions?: string[]; isOrganizationAdmin?: boolean } }
    if (req.user?.isOrganizationAdmin || req.user?.permissions?.includes('*') || req.user?.permissions?.includes(permission)) return next()
    return _res.status(403).json({ message: 'Forbidden' })
}

export const checkAnyPermission = (permissions: string) => (_req: Request, _res: Response, next: NextFunction) => {
    const req = _req as Request & { user?: { permissions?: string[]; isOrganizationAdmin?: boolean } }
    const permissionList = permissions.split(',').map((permission) => permission.trim())
    if (req.user?.isOrganizationAdmin || req.user?.permissions?.includes('*')) return next()
    if (permissionList.some((permission) => req.user?.permissions?.includes(permission))) return next()
    return _res.status(403).json({ message: 'Forbidden' })
}
