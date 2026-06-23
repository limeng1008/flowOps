import { LicenseVerificationResult } from '../license'
import { setLicenseState } from '../license/state'
import { isNodeAllowedByEntitlement } from './entitlementGate'

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

describe('节点级 tier 门控', () => {
    beforeEach(() => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        delete process.env.FLOWOPS_EDITION
        delete process.env.EDITION
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    afterAll(() => {
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
    })

    it('未登记门控的节点所有档可见', () => {
        expect(isNodeAllowedByEntitlement('chatOpenAI')).toBe(true)
        expect(isNodeAllowedByEntitlement('chatDeepseek')).toBe(true)
    })

    it('free 档隐藏 PPT/Excel 导出节点', () => {
        expect(isNodeAllowedByEntitlement('pptxExportAgentflow')).toBe(false)
        expect(isNodeAllowedByEntitlement('spreadsheetExportAgentflow')).toBe(false)
    })

    it('pro 档(含 ppt-excel-export)放开导出节点', () => {
        setLicenseState(makeLicenseState('active', { tier: 'pro' }))
        expect(isNodeAllowedByEntitlement('pptxExportAgentflow')).toBe(true)
        expect(isNodeAllowedByEntitlement('spreadsheetExportAgentflow')).toBe(true)
    })

    it('满血/enterprise 放开导出节点', () => {
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        expect(isNodeAllowedByEntitlement('pptxExportAgentflow')).toBe(true)
        expect(isNodeAllowedByEntitlement('spreadsheetExportAgentflow')).toBe(true)
    })

    it('转人工节点 humanHandoff 归 team+(pro 不含)', () => {
        // free 隐藏
        expect(isNodeAllowedByEntitlement('humanHandoff')).toBe(false)
        // pro 仍隐藏(human-handoff 是 team+,非 pro)
        setLicenseState(makeLicenseState('active', { tier: 'pro' }))
        expect(isNodeAllowedByEntitlement('humanHandoff')).toBe(false)
        // team 放开
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        expect(isNodeAllowedByEntitlement('humanHandoff')).toBe(true)
        // enterprise 放开
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        expect(isNodeAllowedByEntitlement('humanHandoff')).toBe(true)
    })
})
