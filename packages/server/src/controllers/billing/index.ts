import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import BillingService, { assertBillingAdmin } from '../../services/billing'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

const getMyBillingOverview = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const organizationId = req.user?.activeOrganizationId
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
        return res.status(StatusCodes.OK).json(await BillingService.getOrganizationOverview(organizationId))
    } catch (error) {
        next(error)
    }
}

const listPlans = async (req: Request, res: Response, next: NextFunction) => {
    try {
        assertBillingAdmin(req.user)
        return res.status(StatusCodes.OK).json(await BillingService.listPlans())
    } catch (error) {
        next(error)
    }
}

const upsertPlan = async (req: Request, res: Response, next: NextFunction) => {
    try {
        assertBillingAdmin(req.user)
        return res.status(StatusCodes.OK).json(await BillingService.upsertPlan(req.body))
    } catch (error) {
        next(error)
    }
}

const listOrganizations = async (req: Request, res: Response, next: NextFunction) => {
    try {
        assertBillingAdmin(req.user)
        return res.status(StatusCodes.OK).json(await BillingService.listOrganizationsWithBilling())
    } catch (error) {
        next(error)
    }
}

const setOrganizationSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        assertBillingAdmin(req.user)
        const { organizationId, planId, currentPeriodEnd, quotaOverrides, notes } = req.body || {}
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
        if (!planId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Plan ID is required')
        return res.status(StatusCodes.OK).json(
            await BillingService.setOrganizationSubscription({
                organizationId,
                planId,
                currentPeriodEnd,
                quotaOverrides,
                notes
            })
        )
    } catch (error) {
        next(error)
    }
}

const cancelOrganizationSubscription = async (req: Request, res: Response, next: NextFunction) => {
    try {
        assertBillingAdmin(req.user)
        const { organizationId } = req.body || {}
        if (!organizationId) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Organization ID is required')
        return res.status(StatusCodes.OK).json(await BillingService.cancelOrganizationSubscription(organizationId))
    } catch (error) {
        next(error)
    }
}

export default {
    getMyBillingOverview,
    listPlans,
    upsertPlan,
    listOrganizations,
    setOrganizationSubscription,
    cancelOrganizationSubscription
}
