const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

const billingCenterKeys = [
    'menu.billing',
    'menu.license',
    'pages.billingCenter.title',
    'pages.billingCenter.subtitle',
    'pages.billingCenter.currentPlan',
    'pages.billingCenter.resourceBalance',
    'pages.billingCenter.monthlyUsage',
    'pages.billingCenter.planComparison',
    'pages.billingCenter.currentTier',
    'pages.billingCenter.recharge',
    'pages.billingCenter.upgrade',
    'pages.billingCenter.contactSales',
    'pages.billingCenter.importLicense',
    'pages.billingCenter.privateNoOnlineRecharge',
    'pages.billingCenter.cloudRechargeHint',
    'pages.billingCenter.lowCreditsWarning',
    'pages.billingCenter.graceWarning',
    'pages.billingCenter.expiringSoonWarning',
    'pages.billingCenter.noUsage',
    'pages.billingCenter.includedCredits',
    'pages.billingCenter.source',
    'pages.billingCenter.privateDeployment',
    'pages.billingCenter.concurrency',
    'pages.billingCenter.workspaces',
    'pages.billingCenter.unlimited',
    'pages.billingCenter.optional',
    'pages.billingCenter.notAvailable',
    'pages.billingCenter.custom',
    'pages.billingCenter.usageActions.prediction',
    'pages.billingCenter.usageActions.retrieval',
    'pages.billingCenter.usageActions.export',
    'pages.billingCenter.usageActions.workflow',
    'pages.billingCenter.usageActions.embedding',
    'pages.billingCenter.usageActions.other',
    'pages.entitlement.tiers.free',
    'pages.entitlement.tiers.pro',
    'pages.entitlement.tiers.team',
    'pages.entitlement.tiers.enterprise'
]

describe('billing center i18n coverage', () => {
    it.each(billingCenterKeys)('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes billing center copy through i18n and gates online payment by edition', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/billing/index.jsx'), 'utf8')

        billingCenterKeys.filter((key) => key.startsWith('pages.billingCenter.')).forEach((key) => expect(source).toContain(`t('${key}'`))
        expect(source).toContain('isCloudBillingEdition')
        expect(source).toContain('showOnlinePayment')
        expect(source).toContain("navigate('/license')")
        expect(source).toContain('openPaymentDialog && isCloudEdition')
    })
})
