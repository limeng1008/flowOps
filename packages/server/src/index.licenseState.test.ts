const mockGetDataSource = jest.fn()
const mockGetActiveLicense = jest.fn()

jest.mock('./DataSource', () => ({
    getDataSource: () => mockGetDataSource()
}))

jest.mock('./services/license', () => ({
    __esModule: true,
    default: {
        getActiveLicense: (...args: any[]) => mockGetActiveLicense(...args)
    }
}))

jest.mock('./routes', () => ({
    __esModule: true,
    default: (_req: unknown, _res: unknown, next: () => void) => next()
}))

jest.mock('./utils/logger', () => ({
    __esModule: true,
    default: { debug: jest.fn(), error: jest.fn(), info: jest.fn(), warn: jest.fn() },
    expressRequestLogger: (_req: unknown, _res: unknown, next: () => void) => next()
}))

import { App } from './index'
import { LicenseVerificationResult } from './services/license'
import { setLicenseState } from './services/license/state'

const makeState = (
    status: LicenseVerificationResult['status'],
    overrides: Partial<LicenseVerificationResult> = {}
): LicenseVerificationResult => ({
    valid: status === 'active' || status === 'grace',
    status,
    readOnly: status === 'grace' || status === 'expired',
    features: [],
    machineFingerprint: [],
    currentFingerprint: 'fp-test',
    ...overrides
})

describe('App license state cache', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockGetDataSource.mockReturnValue({})
        setLicenseState(makeState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    it('mirrors the shared license state cache synchronously', () => {
        const app = new App()
        const active = makeState('active', { licenseId: 'lic_app_001', model: 'subscription' })

        setLicenseState(active)

        expect(app.licenseState).toBe(active)
    })

    it('refreshes App.licenseState from LicenseService', async () => {
        const app = new App()
        const perpetual = makeState('active', { licenseId: 'lic_app_002', model: 'perpetual' })
        mockGetActiveLicense.mockResolvedValue(perpetual)

        await expect(app.refreshLicenseState()).resolves.toBe(perpetual)

        expect(mockGetActiveLicense).toHaveBeenCalledTimes(1)
        expect(app.licenseState).toBe(perpetual)
    })
})
