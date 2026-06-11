import { NextFunction, Request, Response } from 'express'
import {
    initializeJwtCookieMiddleware as enterpriseInitializeJwtCookieMiddleware,
    verifyToken as enterpriseVerifyToken,
    verifyTokenForBullMQDashboard as enterpriseVerifyTokenForBullMQDashboard
} from '../enterprise/middleware/passport'
import { initAuthSecrets as enterpriseInitAuthSecrets } from '../enterprise/utils/authSecrets'
import { initSelfAuthSecrets } from './self/secrets'
import { verifyToken as selfVerifyToken, verifyTokenForBullMQDashboard as selfVerifyTokenForBullMQDashboard } from './self/middleware'
import { isSelfIamMode } from './provider'
import { configureSelfLocalStrategy } from './self/auth/passport'

export const initializeJwtCookieMiddleware = async (...args: Parameters<typeof enterpriseInitializeJwtCookieMiddleware>) => {
    if (isSelfIamMode()) {
        const app = args[0]
        app.use(configureSelfLocalStrategy().initialize())
        return undefined
    }
    return await enterpriseInitializeJwtCookieMiddleware(...args)
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    if (isSelfIamMode()) return selfVerifyToken(req, res, next)
    return enterpriseVerifyToken(req, res, next)
}

export const verifyTokenForBullMQDashboard = (req: Request, res: Response, next: NextFunction) => {
    if (isSelfIamMode()) return selfVerifyTokenForBullMQDashboard(req, res, next)
    return enterpriseVerifyTokenForBullMQDashboard(req, res, next)
}

export const initAuthSecrets = async () => {
    if (isSelfIamMode()) return await initSelfAuthSecrets()
    return await enterpriseInitAuthSecrets()
}
