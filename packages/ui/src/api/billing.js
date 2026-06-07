import client from '@/api/client'

const getMyBillingOverview = () => client.get('/billing/me')
const getPlans = () => client.get('/billing/admin/plans')
const upsertPlan = (body) => client.post('/billing/admin/plans', body)
const getOrganizations = () => client.get('/billing/admin/organizations')
const setOrganizationSubscription = (body) => client.post('/billing/admin/subscriptions', body)
const cancelOrganizationSubscription = (body) => client.post('/billing/admin/subscriptions/cancel', body)
const createPaymentOrder = (body) => client.post('/payment/order', body)
const getPaymentOrder = (orderNo) => client.get(`/payment/order/${orderNo}`)

export default {
    getMyBillingOverview,
    getPlans,
    upsertPlan,
    getOrganizations,
    setOrganizationSubscription,
    cancelOrganizationSubscription,
    createPaymentOrder,
    getPaymentOrder
}
