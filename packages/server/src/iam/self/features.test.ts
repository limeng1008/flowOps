import { LicenseVerificationResult } from '../../services/license'
import { setLicenseState } from '../../services/license/state'
import {
    SELF_ENTERPRISE_FEATURE_FLAGS,
    getLicensedSelfFeatureSet,
    getSelfEnterpriseFeatures,
    getSelfFeatureTier,
    isSelfFeatureAllowed
} from './features'

const makeLicenseState = (
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

describe('FlowOps self license feature mapping', () => {
    const originalFlowOpsEdition = process.env.FLOWOPS_EDITION
    const originalEdition = process.env.EDITION

    beforeEach(() => {
        delete process.env.FLOWOPS_EDITION
        delete process.env.EDITION
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    afterAll(() => {
        if (originalFlowOpsEdition === undefined) delete process.env.FLOWOPS_EDITION
        else process.env.FLOWOPS_EDITION = originalFlowOpsEdition
        if (originalEdition === undefined) delete process.env.EDITION
        else process.env.EDITION = originalEdition
    })

    it('treats missing licenses as the free tier with no advanced IAM features', () => {
        expect(getSelfFeatureTier()).toBe('free')
        expect(getLicensedSelfFeatureSet()).toEqual(new Set())
        expect(getSelfEnterpriseFeatures()).toEqual(Object.fromEntries(SELF_ENTERPRISE_FEATURE_FLAGS.map((feature) => [feature, false])))
    })

    it('opens evaluation and log features for pro while keeping team administration closed', () => {
        setLicenseState(makeLicenseState('active', { tier: 'pro' }))

        expect(isSelfFeatureAllowed('feat:datasets')).toBe(true)
        expect(isSelfFeatureAllowed('feat:evaluations')).toBe(true)
        expect(isSelfFeatureAllowed('feat:evaluators')).toBe(true)
        expect(isSelfFeatureAllowed('feat:logs')).toBe(true)
        expect(isSelfFeatureAllowed('feat:roles')).toBe(false)
        expect(isSelfFeatureAllowed('feat:users')).toBe(false)
    })

    it('opens team administration features for team licenses', () => {
        setLicenseState(makeLicenseState('grace', { tier: 'team' }))

        expect(isSelfFeatureAllowed('feat:roles')).toBe(true)
        expect(isSelfFeatureAllowed('feat:users')).toBe(true)
        expect(isSelfFeatureAllowed('feat:workspaces')).toBe(true)
        expect(isSelfFeatureAllowed('feat:login-activity')).toBe(true)
        expect(isSelfFeatureAllowed('feat:files')).toBe(false)
        expect(isSelfFeatureAllowed('feat:sso-config')).toBe(false)
    })

    it('opens enterprise-only file management but keeps self SSO config closed', () => {
        setLicenseState(makeLicenseState('active', { tier: 'enterprise' }))

        expect(isSelfFeatureAllowed('feat:files')).toBe(true)
        expect(isSelfFeatureAllowed('feat:sso-config')).toBe(false)
    })

    it('does not cut cloud mode by offline license tier', () => {
        process.env.FLOWOPS_EDITION = 'cloud'
        setLicenseState(makeLicenseState('expired', { tier: 'free' }))

        for (const feature of SELF_ENTERPRISE_FEATURE_FLAGS) {
            expect(isSelfFeatureAllowed(feature)).toBe(feature !== 'feat:sso-config')
        }
    })
})
