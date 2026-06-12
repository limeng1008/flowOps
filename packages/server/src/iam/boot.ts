import { Application, NextFunction, Request, Response } from 'express'
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
import type { IFlowOpsIdentity } from './identity'

type InitializeJwtCookieMiddleware = (app: Application, identityManager: IFlowOpsIdentity) => Promise<void> | void
type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void
type InitAuthSecrets = () => Promise<void> | void

// 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
const bridgedEnterpriseInitializeJwtCookieMiddleware = enterpriseInitializeJwtCookieMiddleware as unknown as InitializeJwtCookieMiddleware
// 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
const bridgedEnterpriseVerifyToken = enterpriseVerifyToken as unknown as ExpressMiddleware
// 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
const bridgedEnterpriseVerifyTokenForBullMQDashboard = enterpriseVerifyTokenForBullMQDashboard as unknown as ExpressMiddleware
// 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
const bridgedEnterpriseInitAuthSecrets = enterpriseInitAuthSecrets as unknown as InitAuthSecrets

export const initializeJwtCookieMiddleware = async (app: Application, identityManager: IFlowOpsIdentity) => {
    if (isSelfIamMode()) {
        app.use(configureSelfLocalStrategy().initialize())
        return undefined
    }
    return await bridgedEnterpriseInitializeJwtCookieMiddleware(app, identityManager)
}

export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    if (isSelfIamMode()) return selfVerifyToken(req, res, next)
    return bridgedEnterpriseVerifyToken(req, res, next)
}

export const verifyTokenForBullMQDashboard = (req: Request, res: Response, next: NextFunction) => {
    if (isSelfIamMode()) return selfVerifyTokenForBullMQDashboard(req, res, next)
    return bridgedEnterpriseVerifyTokenForBullMQDashboard(req, res, next)
}

export const initAuthSecrets = async () => {
    if (isSelfIamMode()) return await initSelfAuthSecrets()
    return await bridgedEnterpriseInitAuthSecrets()
}
