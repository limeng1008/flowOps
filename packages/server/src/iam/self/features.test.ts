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
    const originalLocalCommercial = process.env.FLOWOPS_LOCAL_COMMERCIAL

    beforeEach(() => {
        delete process.env.FLOWOPS_EDITION
        delete process.env.EDITION
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    afterAll(() => {
        if (originalFlowOpsEdition === undefined) delete process.env.FLOWOPS_EDITION
        else process.env.FLOWOPS_EDITION = originalFlowOpsEdition
        if (originalEdition === undefined) delete process.env.EDITION
        else process.env.EDITION = originalEdition
        if (originalLocalCommercial === undefined) delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        else process.env.FLOWOPS_LOCAL_COMMERCIAL = originalLocalCommercial
    })

    it('treats missing licenses as the free tier (only the free entitlement features unlocked)', () => {
        expect(getSelfFeatureTier()).toBe('free')
        // free 档解锁的是基础工作流 + 国产模型 + API，而非空集
        expect(getLicensedSelfFeatureSet()).toEqual(new Set(['basic-workflow', 'china-models', 'api-access']))

        const features = getSelfEnterpriseFeatures()
        expect(features['china-models']).toBe(true)
        expect(features['api-access']).toBe(true)
        expect(features['basic-workflow']).toBe(true)
        // 高档位才有的功能全部关闭
        expect(features['content-safety']).toBe(false)
        expect(features['human-handoff']).toBe(false)
        expect(features['custom-branding']).toBe(false)
        expect(features['feat:datasets']).toBe(false)
        expect(features['feat:audit']).toBe(false)
        expect(features['feat:sso-config']).toBe(false)
    })

    it('gates FlowOps commercial features by tier (china / content-safety / handoff / branding)', () => {
        // pro：内容安全 + PPT/Excel 导出 + trace，但人工接管/白标仍关
        setLicenseState(makeLicenseState('active', { tier: 'pro' }))
        expect(isSelfFeatureAllowed('content-safety')).toBe(true)
        expect(isSelfFeatureAllowed('ppt-excel-export')).toBe(true)
        expect(isSelfFeatureAllowed('trace-debugging')).toBe(true)
        expect(isSelfFeatureAllowed('human-handoff')).toBe(false)
        expect(isSelfFeatureAllowed('custom-branding')).toBe(false)

        // team：人工接管 + 国产云向量 + 多工作区 + 白标
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        expect(isSelfFeatureAllowed('human-handoff')).toBe(true)
        expect(isSelfFeatureAllowed('china-cloud-vector-stores')).toBe(true)
        expect(isSelfFeatureAllowed('multi-workspace')).toBe(true)
        expect(isSelfFeatureAllowed('custom-branding')).toBe(true)

        // enterprise：全部商业化位解锁
        setLicenseState(makeLicenseState('active', { tier: 'enterprise' }))
        expect(isSelfFeatureAllowed('content-safety')).toBe(true)
        expect(isSelfFeatureAllowed('human-handoff')).toBe(true)
        expect(isSelfFeatureAllowed('custom-branding')).toBe(true)
        expect(isSelfFeatureAllowed('private-offline-license')).toBe(true)
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
        expect(isSelfFeatureAllowed('feat:audit')).toBe(true)
        expect(isSelfFeatureAllowed('feat:files')).toBe(false)
        expect(isSelfFeatureAllowed('feat:sso-config')).toBe(false)
    })

    it('opens enterprise-only file management but keeps self SSO config closed', () => {
        setLicenseState(makeLicenseState('active', { tier: 'enterprise' }))

        expect(isSelfFeatureAllowed('feat:files')).toBe(true)
        expect(isSelfFeatureAllowed('feat:audit')).toBe(true)
        expect(isSelfFeatureAllowed('feat:sso-config')).toBe(false)
    })

    it('does not cut cloud mode by offline license tier', () => {
        process.env.FLOWOPS_EDITION = 'cloud'
        setLicenseState(makeLicenseState('expired', { tier: 'free' }))

        for (const feature of SELF_ENTERPRISE_FEATURE_FLAGS) {
            expect(isSelfFeatureAllowed(feature)).toBe(feature !== 'feat:sso-config')
        }
    })

    it('treats local commercial deployments as the enterprise tier', () => {
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))

        expect(getSelfFeatureTier()).toBe('enterprise')
        expect(isSelfFeatureAllowed('feat:files')).toBe(true)
        expect(isSelfFeatureAllowed('feat:sso-config')).toBe(false)
    })
})
