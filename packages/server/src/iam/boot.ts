import { Application, NextFunction, Request, Response } from 'express'
import { initSelfAuthSecrets } from './self/secrets'
import { verifyToken as selfVerifyToken, verifyTokenForBullMQDashboard as selfVerifyTokenForBullMQDashboard } from './self/middleware'
import { isSelfIamMode } from './provider'
import { configureSelfLocalStrategy } from './self/auth/passport'
import type { IFlowOpsIdentity } from './identity'

type InitializeJwtCookieMiddleware = (app: Application, identityManager: IFlowOpsIdentity) => Promise<void> | void
type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void
type InitAuthSecrets = () => Promise<void> | void

type EnterprisePassportModule = {
    initializeJwtCookieMiddleware: InitializeJwtCookieMiddleware
    verifyToken: ExpressMiddleware
    verifyTokenForBullMQDashboard: ExpressMiddleware
}

type EnterpriseAuthSecretsModule = {
    initAuthSecrets: InitAuthSecrets
}

const getEnterprisePassport = (): EnterprisePassportModule => require('../enterprise/middleware/passport') as EnterprisePassportModule

const getEnterpriseAuthSecrets = (): InitAuthSecrets => {
    const enterpriseAuthSecrets = require('../enterprise/utils/authSecrets') as EnterpriseAuthSecretsModule
    return enterpriseAuthSecrets.initAuthSecrets
}

export const initializeJwtCookieMiddleware = async (app: Application, identityManager: IFlowOpsIdentity) => {
    if (isSelfIamMode()) {
        app.use(configureSelfLocalStrategy().initialize())
        return undefined
    }
    return await getEnterprisePassport().initializeJwtCookieMiddleware(app, identityManager)
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    if (isSelfIamMode()) return selfVerifyToken(req, res, next)
    return getEnterprisePassport().verifyToken(req, res, next)
}

export const verifyTokenForBullMQDashboard = (req: Request, res: Response, next: NextFunction) => {
    if (isSelfIamMode()) return selfVerifyTokenForBullMQDashboard(req, res, next)
    return getEnterprisePassport().verifyTokenForBullMQDashboard(req, res, next)
}

export const initAuthSecrets = async () => {
    if (isSelfIamMode()) return await initSelfAuthSecrets()
    const enterpriseInitAuthSecrets = getEnterpriseAuthSecrets()
    return await enterpriseInitAuthSecrets()
}
