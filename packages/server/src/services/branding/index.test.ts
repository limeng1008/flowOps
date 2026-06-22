import { LicenseVerificationResult } from '../license'
import { setLicenseState } from '../license/state'
import { DEFAULT_FLOWOPS_BRAND, getFlowOpsBrand } from './index'

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

describe('FlowOps 白标品牌', () => {
    const brandEnv = [
        'FLOWOPS_BRAND_NAME',
        'FLOWOPS_BRAND_SUPPORT_EMAIL',
        'FLOWOPS_BRAND_REPO_URL',
        'FLOWOPS_BRAND_PRIMARY_COLOR',
        'FLOWOPS_BRAND_LOGO_URL'
    ]
    const original: Record<string, string | undefined> = {}

    beforeEach(() => {
        brandEnv.forEach((k) => {
            original[k] = process.env[k]
            delete process.env[k]
        })
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        delete process.env.FLOWOPS_EDITION
        delete process.env.EDITION
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    afterAll(() => {
        brandEnv.forEach((k) => {
            if (original[k] === undefined) delete process.env[k]
            else process.env[k] = original[k]
        })
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
    })

    it('free 档(无 custom-branding 授权)忽略 env 覆盖,返回内置默认', () => {
        process.env.FLOWOPS_BRAND_NAME = '冒牌品牌'
        process.env.FLOWOPS_BRAND_SUPPORT_EMAIL = 'evil@example.com'
        expect(getFlowOpsBrand()).toEqual(DEFAULT_FLOWOPS_BRAND)
    })

    it('满血/team+(custom-branding 授权)应用部署方 env 覆盖', () => {
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true' // → enterprise 档
        process.env.FLOWOPS_BRAND_NAME = '智云AI'
        process.env.FLOWOPS_BRAND_SUPPORT_EMAIL = 'support@zhiyun.cn'
        process.env.FLOWOPS_BRAND_REPO_URL = 'https://github.com/zhiyun/ai'

        const brand = getFlowOpsBrand()
        expect(brand.name).toBe('智云AI')
        expect(brand.supportEmail).toBe('support@zhiyun.cn')
        expect(brand.repoUrl).toBe('https://github.com/zhiyun/ai')
    })

    it('已授权但未设 env 时回落内置默认(名称 FlowOps、其余空)', () => {
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        const brand = getFlowOpsBrand()
        expect(brand.name).toBe('FlowOps')
        expect(brand.supportEmail).toBe('')
        expect(brand.repoUrl).toBe('')
    })
})
