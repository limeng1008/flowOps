import { NextFunction, Response, Router } from 'express'
import { getDataSource } from '../../../DataSource'
import { FlowOpsAuthError, FlowOpsAuthService, createSelfAuthTokens, verifySelfAccessToken, verifySelfRefreshToken } from './service'
import { SELF_ACCESS_TOKEN_COOKIE, SELF_REFRESH_TOKEN_COOKIE } from '../secrets'
import { configureSelfLocalStrategy } from './passport'

const authRouter = Router()
const accountRouter = Router()
const loginMethodRouter = Router()

const cookieOptions = (maxAge: number) => ({
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: process.env.SECURE_COOKIES === 'true',
    path: '/',
    maxAge
})

const service = () => new FlowOpsAuthService(getDataSource())

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

const clearCookies = (res: Response) => {
    res.clearCookie(SELF_ACCESS_TOKEN_COOKIE, { path: '/' })
    res.clearCookie(SELF_REFRESH_TOKEN_COOKIE, { path: '/' })
}

authRouter.post('/resolve', (_req, res) => res.json({ redirectUrl: '/signin' }))

authRouter.post('/login', async (req, res, next) => {
    configureSelfLocalStrategy().authenticate('flowops-local', { session: false }, (error: unknown, loggedInUser: any, info: any) => {
        if (error) return next(error)
        if (!loggedInUser) return res.status(401).json({ message: info?.message ?? 'Incorrect Email or Password' })
        const tokens = issueCookies(res, loggedInUser)
        return res.json({ ...loggedInUser, token: tokens.accessToken })
    })(req, res, next)
})

authRouter.post('/refreshToken', async (req, res, next) => {
    try {
        const refreshToken = req.cookies?.[SELF_REFRESH_TOKEN_COOKIE]
        if (!refreshToken) throw new FlowOpsAuthError(401, 'Refresh Token Expired')
        const payload = verifySelfRefreshToken(refreshToken)
        const loggedInUser = await service().getLoggedInUser(payload.sub, payload.activeWorkspaceId)
        const tokens = issueCookies(res, loggedInUser)
        res.json({ ...loggedInUser, token: tokens.accessToken })
    } catch (error) {
        if (error instanceof FlowOpsAuthError) return res.status(error.statusCode).json({ message: error.message })
        return res.status(401).json({ message: 'Refresh Token Expired' })
    }
})

authRouter.get('/me', async (req, res, next) => {
    try {
        const accessToken = req.cookies?.[SELF_ACCESS_TOKEN_COOKIE]
        if (!accessToken) throw new FlowOpsAuthError(401, 'Invalid or Missing token')
        const payload = verifySelfAccessToken(accessToken)
        const loggedInUser = await service().getLoggedInUser(payload.sub, payload.activeWorkspaceId)
        res.json(loggedInUser)
    } catch (error) {
        sendError(error, res, next)
    }
})

authRouter.get('/permissions/:type', (_req, res) => res.json([]))
authRouter.get('/sso-success', (_req, res) => res.status(501).json({ message: 'SSO is not enabled' }))

accountRouter.post('/register', async (req, res, next) => {
    try {
        const loggedInUser = await service().registerAccount(req.body)
        res.json(loggedInUser)
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/invite', async (req, res, next) => {
    try {
        const loggedInUser = req.user as any
        if (!loggedInUser?.id) throw new FlowOpsAuthError(401, 'Unauthorized')
        res.json(await service().inviteAccount(req.body, loggedInUser))
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/logout', async (req, res, next) => {
    try {
        const accessToken = req.cookies?.[SELF_ACCESS_TOKEN_COOKIE]
        let userId: string | undefined
        if (accessToken) {
            try {
                userId = verifySelfAccessToken(accessToken).sub
            } catch {
                userId = undefined
            }
        }
        await service().logout(userId)
        clearCookies(res)
        res.json({ message: 'Logout Successful' })
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/forgot-password', async (req, res, next) => {
    try {
        res.json(await service().forgotPassword(req.body))
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/reset-password', async (req, res, next) => {
    try {
        res.json(await service().resetPassword(req.body))
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/verify', async (req, res, next) => {
    try {
        res.json(await service().verifyAccount(req.body))
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/resend-verification', async (_req, res, next) => {
    try {
        res.json(await service().resendVerificationEmail())
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/confirm-email-change', async (req, res, next) => {
    try {
        res.json(await service().verifyAccount(req.body))
    } catch (error) {
        sendError(error, res, next)
    }
})

accountRouter.post('/billing', (_req, res) => res.json({}))
accountRouter.delete('/delete', (_req, res) => res.status(501).json({ message: 'Account deletion is not enabled' }))

loginMethodRouter.get('/default', (_req, res) => res.json({ providers: [] }))
loginMethodRouter.get('/', (_req, res) => res.json({ providers: [], callbacks: [] }))
loginMethodRouter.put('/', (_req, res) => res.json({ providers: [], callbacks: [] }))
loginMethodRouter.post('/test', (_req, res) => res.status(501).json({ message: 'SSO is not enabled' }))

export { accountRouter, authRouter, loginMethodRouter }
