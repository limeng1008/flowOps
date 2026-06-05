import express from 'express'
import billingController from '../../controllers/billing'

const router = express.Router()

router.get('/me', billingController.getMyBillingOverview)
router.get('/admin/plans', billingController.listPlans)
router.post('/admin/plans', billingController.upsertPlan)
router.get('/admin/organizations', billingController.listOrganizations)
router.post('/admin/subscriptions', billingController.setOrganizationSubscription)
router.post('/admin/subscriptions/cancel', billingController.cancelOrganizationSubscription)

export default router
