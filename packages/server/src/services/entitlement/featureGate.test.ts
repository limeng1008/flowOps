jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn()
}))

import { StatusCodes } from 'http-status-codes'
import { ENTITLEMENT_ERROR_MESSAGES, FLOWOPS_ENTITLEMENT_FEATURES } from '.'
import { featureGate } from './featureGate'

describe('featureGate', () => {
    const createResponse = () =>
        ({
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any)

    it('continues when the entitlement includes the feature', async () => {
        const next = jest.fn()
        const hasFeature = jest.fn().mockResolvedValue(true)

        await featureGate(FLOWOPS_ENTITLEMENT_FEATURES.traceDebugging, () => ({ hasFeature } as any))(
            { user: { activeOrganizationId: 'org_1' } } as any,
            createResponse(),
            next
        )

        expect(hasFeature).toHaveBeenCalledWith('org_1', FLOWOPS_ENTITLEMENT_FEATURES.traceDebugging)
        expect(next).toHaveBeenCalledWith()
    })

    it('blocks missing features with the Chinese pro-edition error', async () => {
        const next = jest.fn()
        const hasFeature = jest.fn().mockResolvedValue(false)
        const res = createResponse()

        await featureGate(FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs, () => ({ hasFeature } as any))(
            { user: { activeOrganizationId: 'org_1' } } as any,
            res,
            next
        )

        expect(res.status).toHaveBeenCalledWith(StatusCodes.PAYMENT_REQUIRED)
        expect(res.json).toHaveBeenCalledWith({ message: ENTITLEMENT_ERROR_MESSAGES.featureRequired })
        expect(next).not.toHaveBeenCalled()
    })
})
