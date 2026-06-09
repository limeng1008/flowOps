import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { ENTITLEMENT_ERROR_MESSAGES, EntitlementService } from '.'

type FeatureGateService = Pick<EntitlementService, 'hasFeature'>
type FeatureGateServiceFactory = () => FeatureGateService

const getScopeId = (req: Request): string | undefined => {
    const requestWithUser = req as Request & {
        user?: {
            activeOrganizationId?: string
            organizationId?: string
            activeWorkspaceId?: string
        }
    }

    return (
        requestWithUser.user?.activeOrganizationId ??
        requestWithUser.user?.organizationId ??
        requestWithUser.body?.organizationId ??
        requestWithUser.params?.organizationId ??
        requestWithUser.user?.activeWorkspaceId
    )
}

export const featureGate =
    (feature: string, serviceFactory: FeatureGateServiceFactory = () => new EntitlementService()) =>
    async (req: Request, res: Response, next: NextFunction): Promise<void> => {
        try {
            const scopeId = getScopeId(req)
            if (!scopeId) {
                res.status(StatusCodes.FORBIDDEN).json({ message: ENTITLEMENT_ERROR_MESSAGES.featureRequired })
                return
            }

            const allowed = await serviceFactory().hasFeature(scopeId, feature)
            if (!allowed) {
                res.status(StatusCodes.PAYMENT_REQUIRED).json({ message: ENTITLEMENT_ERROR_MESSAGES.featureRequired })
                return
            }

            next()
        } catch (error) {
            next(error)
        }
    }
