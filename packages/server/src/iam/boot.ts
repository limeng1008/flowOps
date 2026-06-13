import { Application, NextFunction, Request, Response } from 'express'
import { initSelfAuthSecrets } from './self/secrets'
import { verifyToken as selfVerifyToken, verifyTokenForBullMQDashboard as selfVerifyTokenForBullMQDashboard } from './self/middleware'
import { isSelfIamMode } from './provider'
import { configureSelfLocalStrategy } from './self/auth/passport'
import type { IFlowOpsIdentity } from './identity'

type InitializeJwtCookieMiddleware = (app: Application, identityManager: IFlowOpsIdentity) => Promise<void> | void
type ExpressMiddleware = (req: Request, res: Response, next: NextFunction) => void
type InitAuthSecrets = () => Promise<void> | void

const getEnterprisePassport = () => {
    // P3 惰化:self 轨不加载 enterprise。
    const enterprisePassport = require('../enterprise/middleware/passport') as Record<string, unknown>
    return {
        // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
        initializeJwtCookieMiddleware: enterprisePassport.initializeJwtCookieMiddleware as unknown as InitializeJwtCookieMiddleware,
        // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
        verifyToken: enterprisePassport.verifyToken as unknown as ExpressMiddleware,
        // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
        verifyTokenForBullMQDashboard: enterprisePassport.verifyTokenForBullMQDashboard as unknown as ExpressMiddleware
    }
}

const getEnterpriseAuthSecrets = (): InitAuthSecrets => {
    // P3 惰化:self 轨不加载 enterprise。
    const enterpriseAuthSecrets = require('../enterprise/utils/authSecrets') as Record<string, unknown>
    // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
    return enterpriseAuthSecrets.initAuthSecrets as unknown as InitAuthSecrets
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
