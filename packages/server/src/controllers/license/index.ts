import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import LicenseService from '../../services/license'

const getStatus = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(StatusCodes.OK).json(await LicenseService.getActiveLicense())
    } catch (error) {
        next(error)
    }
}

const getFingerprint = async (_req: Request, res: Response, next: NextFunction) => {
    try {
        return res.status(StatusCodes.OK).json({ fingerprint: LicenseService.getCurrentFingerprint() })
    } catch (error) {
        next(error)
    }
}

const importLicense = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { license } = req.body || {}
        if (typeof license !== 'string' || !license.trim()) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'License is required')
        }

        return res.status(StatusCodes.OK).json(await LicenseService.importLicense(license))
    } catch (error) {
        next(error)
    }
}

export default {
    getStatus,
    getFingerprint,
    importLicense
}
