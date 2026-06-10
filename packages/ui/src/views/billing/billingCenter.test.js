import {
    buildResourceUsageRows,
    getEntitlementExpiryState,
    getPrimaryBillingAction,
    isCloudBillingEdition,
    resolveFlowOpsEdition
} from './billingCenter'

describe('billing center edition and usage helpers', () => {
    it('resolves cloud/private from the server overview before falling back to settings', () => {
        expect(resolveFlowOpsEdition({ FLOWOPS_EDITION: 'private' }, { edition: 'cloud' })).toBe('cloud')
        expect(resolveFlowOpsEdition({ FLOWOPS_EDITION: 'cloud' }, null)).toBe('cloud')
        expect(resolveFlowOpsEdition({ EDITION: 'cloud' }, null)).toBe('cloud')
        expect(resolveFlowOpsEdition({}, null)).toBe('private')
    })

    it('never exposes online recharge actions in private edition', () => {
        expect(isCloudBillingEdition({ FLOWOPS_EDITION: 'private' }, { edition: 'private' })).toBe(false)
        expect(getPrimaryBillingAction('private')).toMatchObject({
            showOnlinePayment: false,
            showLicenseEntry: true
        })
        expect(getPrimaryBillingAction('cloud')).toMatchObject({
            showOnlinePayment: true,
            showLicenseEntry: false
        })
    })

    it('groups resource usage rows with stable labels and progress values', () => {
        expect(
            buildResourceUsageRows(
                {
                    totalCredits: 25,
                    byAction: [
                        { action: 'prediction', credits: 10 },
                        { action: 'retrieval', credits: 5 },
                        { action: 'export', credits: 10 }
                    ]
                },
                100
            )
        ).toEqual([
            { action: 'prediction', labelKey: 'pages.billingCenter.usageActions.prediction', credits: 10, percent: 10 },
            { action: 'export', labelKey: 'pages.billingCenter.usageActions.export', credits: 10, percent: 10 },
            { action: 'retrieval', labelKey: 'pages.billingCenter.usageActions.retrieval', credits: 5, percent: 5 }
        ])
    })

    it('surfaces grace and expiry warning states without hard-disconnecting the page', () => {
        expect(getEntitlementExpiryState({ readOnly: true, licenseStatus: 'grace' })).toEqual('grace')
        expect(
            getEntitlementExpiryState(
                { expireAt: '2026-06-20T00:00:00.000Z', licenseStatus: 'active' },
                new Date('2026-06-10T00:00:00.000Z')
            )
        ).toEqual('expiringSoon')
        expect(getEntitlementExpiryState({ expireAt: '2026-08-01T00:00:00.000Z' }, new Date('2026-06-10T00:00:00.000Z'))).toEqual(null)
    })
})
