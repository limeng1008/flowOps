jest.mock('./enterprise/services/login-method.service', () => ({
    LoginMethodService: jest.fn()
}))

jest.mock('./enterprise/services/organization.service', () => ({
    OrganizationService: jest.fn()
}))

jest.mock('./enterprise/sso/Auth0SSO', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ initialize: jest.fn(), setSSOConfig: jest.fn(), refreshToken: jest.fn() }))
}))

jest.mock('./enterprise/sso/AzureSSO', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ initialize: jest.fn(), setSSOConfig: jest.fn(), refreshToken: jest.fn() }))
}))

jest.mock('./enterprise/sso/GithubSSO', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ initialize: jest.fn(), setSSOConfig: jest.fn(), refreshToken: jest.fn() }))
}))

jest.mock('./enterprise/sso/GoogleSSO', () => ({
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({ initialize: jest.fn(), setSSOConfig: jest.fn(), refreshToken: jest.fn() }))
}))

jest.mock('./utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn()
}))

import { IdentityManager } from './IdentityManager'
import { Platform } from './Interface'
import { ENTERPRISE_FEATURE_FLAGS } from './utils/quotaUsage'

const originalEnv = process.env

describe('IdentityManager local commercial mode', () => {
    beforeEach(() => {
        jest.resetModules()
        process.env = { ...originalEnv }
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        delete process.env.FLOWOPS_LOCAL_PRODUCT_ID
        delete process.env.FLOWISE_EE_LICENSE_KEY
        delete process.env.LICENSE_URL
        delete process.env.OFFLINE
        delete process.env.STRIPE_SECRET_KEY
    })

    afterAll(() => {
        process.env = originalEnv
    })

    it('keeps the default deployment open source when no local commercial flag or license is configured', async () => {
        const identityManager = new IdentityManager()

        await identityManager.initialize()

        expect(identityManager.getPlatformType()).toBe(Platform.OPEN_SOURCE)
        expect(identityManager.isLicenseValid()).toBe(false)
        await expect(identityManager.getFeaturesByPlan('')).resolves.toEqual({})
    })

    it('treats FLOWOPS_LOCAL_COMMERCIAL=true as a valid local enterprise deployment with management features', async () => {
        process.env.FLOWOPS_LOCAL_COMMERCIAL = 'true'
        process.env.FLOWOPS_LOCAL_PRODUCT_ID = 'flowops-local-pro'
        const identityManager = new IdentityManager()

        await identityManager.initialize()

        expect(identityManager.getPlatformType()).toBe(Platform.ENTERPRISE)
        expect(identityManager.isLicenseValid()).toBe(true)
        await expect(identityManager.getProductIdFromSubscription('local-subscription')).resolves.toBe('flowops-local-pro')

        const features = await identityManager.getFeaturesByPlan('local-subscription')
        for (const feature of ENTERPRISE_FEATURE_FLAGS) {
            expect(features[feature]).toBe('true')
        }
    })
})
