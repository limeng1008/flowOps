import { LicenseVerificationResult } from '.'
import LicenseService from '.'
import { getLicenseState, refreshLicenseState, setLicenseState, subscribeLicenseState } from './state'

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

describe('license runtime state cache', () => {
    beforeEach(() => {
        jest.restoreAllMocks()
        setLicenseState(makeState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    it('stores a synchronous license state snapshot and notifies subscribers', () => {
        const listener = jest.fn()
        const unsubscribe = subscribeLicenseState(listener)
        const active = makeState('active', { licenseId: 'lic_active_001', model: 'subscription' })

        setLicenseState(active)

        expect(getLicenseState()).toBe(active)
        expect(listener).toHaveBeenLastCalledWith(active)

        unsubscribe()
        setLicenseState(makeState('expired'))
        expect(listener).toHaveBeenCalledTimes(2)
    })

    it('refreshes the cache through LicenseService.getActiveLicense', async () => {
        const active = makeState('active', { licenseId: 'lic_active_002', model: 'perpetual' })
        jest.spyOn(LicenseService, 'getActiveLicense').mockResolvedValue(active)

        await expect(refreshLicenseState()).resolves.toBe(active)

        expect(LicenseService.getActiveLicense).toHaveBeenCalledTimes(1)
        expect(getLicenseState()).toBe(active)
    })
})
