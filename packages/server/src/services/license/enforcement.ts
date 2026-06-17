import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { getFlowOpsEdition } from '../edition'
import { isLocalCommercialEnabled } from '../entitlement/catalog'
import { getLicenseState } from './state'
import type { LicenseVerificationResult } from '.'

type LicenseStateReader = () => LicenseVerificationResult

const GRACE_READ_ONLY_MESSAGE = '授权宽限期,只读,请续费'
const LICENSE_INVALID_MESSAGE = '授权已失效,请导入有效授权'
const FINGERPRINT_MISMATCH_MESSAGE = '授权绑定的机器不匹配,请重新申请授权'

const normalizePath = (path: string): string => {
    const normalized = path.toLowerCase()
    return normalized.startsWith('/api/v1') ? normalized.slice('/api/v1'.length) || '/' : normalized
}

const pathStartsWith = (path: string, prefix: string): boolean => path === prefix || path.startsWith(`${prefix}/`)

const isAuthRecoveryPath = (path: string): boolean => {
    const authPaths = ['/auth/resolve', '/auth/login', '/auth/logout', '/auth/refreshtoken', '/auth/me', '/account/logout']
    return authPaths.some((allowedPath) => path === allowedPath)
}

const isLicenseRecoveryPath = (path: string): boolean => pathStartsWith(path, '/license')

const isSettingsPath = (path: string): boolean => pathStartsWith(path, '/settings')

const isPredictionRunPath = (path: string): boolean =>
    pathStartsWith(path, '/prediction') || pathStartsWith(path, '/internal-prediction') || path === '/chatmessage/abort'

const isReadMethod = (method: string): boolean => method === 'GET' || method === 'HEAD'

const isGraceAllowed = (req: Request): boolean => {
    const path = normalizePath(req.path)
    return (
        isReadMethod(req.method) ||
        isAuthRecoveryPath(path) ||
        isLicenseRecoveryPath(path) ||
        isSettingsPath(path) ||
        isPredictionRunPath(path)
    )
}

const isExpiredAllowed = (req: Request): boolean => {
    const path = normalizePath(req.path)
    return isAuthRecoveryPath(path) || isLicenseRecoveryPath(path) || isSettingsPath(path)
}

const block = (res: Response, state: LicenseVerificationResult, message: string) =>
    res.status(StatusCodes.PAYMENT_REQUIRED).json({
        error: message,
        message,
        status: state.status,
        reason: state.reason
    })

export const createLicenseEnforcementMiddleware =
    (readLicenseState: LicenseStateReader = getLicenseState) =>
    (req: Request, res: Response, next: NextFunction) => {
        if (!req.path.toLowerCase().startsWith('/api/v1')) return next()
        if (getFlowOpsEdition() === 'cloud' || isLocalCommercialEnabled()) return next()

        const state = readLicenseState()
        if (state.status === 'missing' || state.status === 'active') return next()
        if (state.status === 'grace') {
            if (isGraceAllowed(req)) return next()
            return block(res, state, GRACE_READ_ONLY_MESSAGE)
        }
        if (state.status === 'expired' || state.status === 'invalid') {
            if (isExpiredAllowed(req)) return next()
            const message = state.reason === 'FINGERPRINT_MISMATCH' ? FINGERPRINT_MISMATCH_MESSAGE : LICENSE_INVALID_MESSAGE
            return block(res, state, message)
        }

        return next()
    }
