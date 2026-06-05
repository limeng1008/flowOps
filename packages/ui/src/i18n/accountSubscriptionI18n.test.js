const fs = require('fs')
const path = require('path')

const en = require('./locales/en.json')
const zh = require('./locales/zh.json')

const get = (obj, key) => key.split('.').reduce((acc, part) => acc?.[part], obj)

const accountKeys = [
    'pages.account.subscriptionBilling',
    'pages.account.currentOrganizationPlan',
    'pages.account.billingSubtitle',
    'pages.account.billing',
    'pages.account.changePlan',
    'pages.account.seats',
    'pages.account.seatsIncludedInPlan',
    'pages.account.additionalSeatsPurchased',
    'pages.account.occupiedSeats',
    'pages.account.removeSeats',
    'pages.account.addSeats',
    'pages.account.addSeatsProOnly',
    'pages.account.predictions',
    'pages.account.storage',
    'pages.account.commercialQuota',
    'pages.account.localBillingPlan',
    'pages.account.manualBillingNotice',
    'pages.account.manualBillingAction',
    'pages.account.tokenUsage',
    'pages.account.botUsage',
    'pages.account.seatUsage',
    'pages.account.unlimited',
    'pages.account.notActivated',
    'pages.account.currentPeriodEnd',
    'pages.account.failedBillingPortal',
    'pages.account.emailChangePending',
    'pages.account.failedUpdateProfile',
    'pages.account.oldPasswordRequired',
    'pages.account.passwordMismatch',
    'pages.account.failedUpdatePassword',
    'pages.account.noProrationDate',
    'pages.account.seatsUpdated',
    'pages.account.failedUpdateSeats',
    'pages.account.removeAdditionalSeats',
    'pages.account.removeUsersBeforeSeats',
    'pages.account.emptySeats',
    'pages.account.emptySeatsToRemove',
    'pages.account.newTotalSeats',
    'pages.account.paymentMethod',
    'pages.account.expires',
    'pages.account.noPaymentMethod',
    'pages.account.addPaymentMethodBillingPortal',
    'pages.account.additionalSeatsLeftProrated',
    'pages.account.creditBalance',
    'pages.account.dueToday',
    'pages.account.creditNextInvoice',
    'pages.account.addAdditionalSeats',
    'pages.account.seatsIncludedWithPlan',
    'pages.account.additionalSeatsToAdd',
    'pages.account.additionalSeatsProrated',
    'pages.account.appliedAccountBalance',
    'pages.account.qty',
    'pages.account.each',
    'pages.account.updating',
    'pages.account.deleting',
    'pages.account.deleteYourAccount',
    'pages.account.deleteAccountDescription',
    'pages.account.deleteAccountConfirmDescription',
    'pages.account.deleteAccountTypePrompt',
    'pages.account.deleteConfirmationText',
    'pages.account.confirm'
]

const pricingKeys = [
    'pages.account.pricingPlans',
    'pages.account.currentPlan',
    'pages.account.mostPopular',
    'pages.account.firstMonthFree',
    'pages.account.contactUs',
    'pages.account.getStarted',
    'pages.account.confirmPlanChange',
    'pages.account.mustRemoveSeatsUsers',
    'pages.account.mustRemoveWorkspaces',
    'pages.account.mustRemoveSharingApiKeys',
    'pages.account.openingBillingPortal',
    'pages.account.eligibleFirstMonthFree',
    'pages.account.planLabel',
    'pages.account.firstMonthDiscount',
    'pages.account.updatingPlan',
    'pages.account.confirmChange',
    'pages.account.subscriptionUpdated',
    'pages.account.subscriptionUpdateFailed',
    'pages.account.subscriptionVerifyFailed'
]

describe('account and subscription i18n coverage', () => {
    it.each([...accountKeys, ...pricingKeys])('has English and Chinese copy for %s', (key) => {
        expect(get(en, key)).toBeTruthy()
        expect(get(zh, key)).toBeTruthy()
    })

    it('routes account settings subscription, seats, billing, and delete-account copy through i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/account/index.jsx'), 'utf8')

        accountKeys.forEach((key) => {
            expect(source).toContain(`t('${key}'`)
        })
        expect(source).toContain('toLocaleDateString(dateLocale')
        expect(source).toContain('resolveApiErrorMessage')
        expect(source).not.toContain('error.response.data')
        expect(source).not.toContain("title='Subscription & Billing'")
        expect(source).not.toContain('>Current Organization Plan:<')
        expect(source).not.toContain('Update your billing details and subscription')
        expect(source).not.toContain('>Billing<')
        expect(source).not.toContain('Change Plan')
        expect(source).not.toContain("title='Seats'")
        expect(source).not.toContain('>Seats Included in Plan:<')
        expect(source).not.toContain('>Additional Seats Purchased:<')
        expect(source).not.toContain('>Occupied Seats:<')
        expect(source).not.toContain('>Remove Seats<')
        expect(source).not.toContain('Add Seats is available only for PRO plan')
        expect(source).not.toContain('>Add Seats<')
        expect(source).not.toContain('>Predictions<')
        expect(source).not.toContain('>Storage<')
        expect(source).not.toContain('Remove Additional Seats')
        expect(source).not.toContain('Add Additional Seats')
        expect(source).not.toContain('Payment Method')
        expect(source).not.toContain('No payment method found')
        expect(source).not.toContain('Add Payment Method in Billing Portal')
        expect(source).not.toContain('Additional Seats Left (Prorated)')
        expect(source).not.toContain('Credit balance')
        expect(source).not.toContain('Due today')
        expect(source).not.toContain('Applied account balance')
        expect(source).not.toContain('permanently delete')
        expect(source).not.toContain('Delete your account')
    })

    it('keeps local billing in manual-activation mode without self-service payment copy', () => {
        const source = fs.readFileSync(path.join(__dirname, '../views/billing/index.jsx'), 'utf8')

        ;['pages.billing.manualActivationNotice', 'pages.billing.manualActivationDetail'].forEach((key) => {
            expect(get(en, key)).toBeTruthy()
            expect(get(zh, key)).toBeTruthy()
            expect(source).toContain(`t('${key}'`)
        })

        expect(source).not.toContain('createOrder')
        expect(source).not.toContain('getOrderStatus')
        expect(source).not.toContain('paymentApi')
        expect(source).not.toContain('扫码')
        expect(source).not.toContain('购买')
    })

    it('routes pricing dialog billing and plan-change copy through i18n', () => {
        const source = fs.readFileSync(path.join(__dirname, '../ui-component/subscription/PricingDialog.jsx'), 'utf8')

        pricingKeys.forEach((key) => {
            expect(source).toContain(`t('${key}'`)
        })
        expect(source).toContain('toLocaleDateString(dateLocale')
        expect(source).not.toContain('Pricing Plans')
        expect(source).not.toContain('Current Plan')
        expect(source).not.toContain('Most Popular')
        expect(source).not.toContain('First Month Free')
        expect(source).not.toContain('Contact Us')
        expect(source).not.toContain('Get Started')
        expect(source).not.toContain('Confirm Plan Change')
        expect(source).not.toContain('Payment Method')
        expect(source).not.toContain('Opening Billing Portal')
        expect(source).not.toContain('Add Payment Method in Billing Portal')
        expect(source).not.toContain('First Month Discount')
        expect(source).not.toContain('Applied account balance')
        expect(source).not.toContain('Credit balance')
        expect(source).not.toContain('Due today')
        expect(source).not.toContain('Updating Plan')
        expect(source).not.toContain('Confirm Change')
    })
})
