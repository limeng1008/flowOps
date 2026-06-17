import { Application, NextFunction, Request, Response } from 'express'
import { initSelfAuthSecrets } from './self/secrets'
import { verifyToken as selfVerifyToken, verifyTokenForBullMQDashboard as selfVerifyTokenForBullMQDashboard } from './self/middleware'
import { configureSelfLocalStrategy } from './self/auth/passport'
import type { IFlowOpsIdentity } from './identity'

type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void

export const initializeJwtCookieMiddleware = async (app: Application, _identityManager: IFlowOpsIdentity) => {
    app.use(configureSelfLocalStrategy().initialize())
    return undefined
}

export const verifyToken: ExpressMiddleware = (req, res, next) => selfVerifyToken(req, res, next)

export const verifyTokenForBullMQDashboard: ExpressMiddleware = (req, res, next) => selfVerifyTokenForBullMQDashboard(req, res, next)

export const initAuthSecrets = async () => await initSelfAuthSecrets()
