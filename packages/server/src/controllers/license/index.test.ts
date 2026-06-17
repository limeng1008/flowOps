import { Request, Response, NextFunction } from 'express'
import { StatusCodes } from 'http-status-codes'

const mockGetActiveLicense = jest.fn()
const mockGetCurrentFingerprint = jest.fn()
const mockImportLicense = jest.fn()
const mockSetLicenseState = jest.fn()

jest.mock('../../services/license', () => ({
    __esModule: true,
    default: {
        getActiveLicense: (...args: any[]) => mockGetActiveLicense(...args),
        getCurrentFingerprint: (...args: any[]) => mockGetCurrentFingerprint(...args),
        importLicense: (...args: any[]) => mockImportLicense(...args)
    }
}))

jest.mock('../../services/license/state', () => ({
    setLicenseState: (...args: any[]) => mockSetLicenseState(...args)
}))

import licenseController from '.'

const mockReq = (overrides: Partial<Request> = {}): Request =>
    ({
        body: {},
        params: {},
        query: {},
        ...overrides
    } as unknown as Request)

const mockRes = (): Response => {
    const res = {} as Response
    res.status = jest.fn().mockReturnValue(res)
    res.json = jest.fn().mockReturnValue(res)
    return res
}

const mockNext = (): NextFunction => jest.fn()

describe('licenseController', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('returns the current active license status', async () => {
        mockGetActiveLicense.mockResolvedValue({ valid: true, status: 'active', licenseId: 'lic_test_001' })
        const res = mockRes()

        await licenseController.getStatus(mockReq(), res, mockNext())

        expect(mockGetActiveLicense).toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
        expect(res.json).toHaveBeenCalledWith({ valid: true, status: 'active', licenseId: 'lic_test_001' })
    })

    it('returns the local machine fingerprint for offline license issuance', async () => {
        mockGetCurrentFingerprint.mockReturnValue('fp-local-node')
        const res = mockRes()

        await licenseController.getFingerprint(mockReq(), res, mockNext())

        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
        expect(res.json).toHaveBeenCalledWith({ fingerprint: 'fp-local-node' })
    })

    it('imports a pasted license through the verification service', async () => {
        mockImportLicense.mockResolvedValue({ valid: true, status: 'active', licenseId: 'lic_test_001' })
        const res = mockRes()

        await licenseController.importLicense(mockReq({ body: { license: 'signed.license.token' } }), res, mockNext())

        expect(mockImportLicense).toHaveBeenCalledWith('signed.license.token')
        expect(mockSetLicenseState).toHaveBeenCalledWith({ valid: true, status: 'active', licenseId: 'lic_test_001' })
        expect(res.status).toHaveBeenCalledWith(StatusCodes.OK)
        expect(res.json).toHaveBeenCalledWith({ valid: true, status: 'active', licenseId: 'lic_test_001' })
    })

    it('rejects import when the license body is missing', async () => {
        const next = mockNext()

        await licenseController.importLicense(mockReq({ body: {} }), mockRes(), next)

        expect(mockImportLicense).not.toHaveBeenCalled()
        expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: StatusCodes.BAD_REQUEST }))
    })
})
