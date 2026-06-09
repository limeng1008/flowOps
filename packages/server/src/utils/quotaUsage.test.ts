jest.mock('./constants', () => ({
    LICENSE_QUOTAS: {
        FLOWS_LIMIT: 'quota:flows',
        USERS_LIMIT: 'quota:users',
        ADDITIONAL_SEATS_LIMIT: 'quota:additionalSeats',
        PREDICTIONS_LIMIT: 'quota:predictions',
        STORAGE_LIMIT: 'quota:storage'
    }
}))

jest.mock('./logger', () => ({
    warn: jest.fn(),
    error: jest.fn()
}))

const mockAssertCreditsAvailable = jest.fn()
const mockConsumeCredits = jest.fn()

jest.mock('../services/entitlement', () => ({
    EntitlementService: jest.fn().mockImplementation(() => ({
        assertCreditsAvailable: mockAssertCreditsAvailable,
        consumeCredits: mockConsumeCredits
    })),
    getPredictionCreditCost: jest.fn(() => 1)
}))

import { checkPredictions, checkUsageLimit, updatePredictionsUsage } from './quotaUsage'
import { LICENSE_QUOTAS } from './constants'

describe('quotaUsage Stripe quota checks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('uses Stripe subscription quotas for flow limits', async () => {
        const usageCacheManager = {
            getQuotas: jest.fn().mockResolvedValue({
                [LICENSE_QUOTAS.FLOWS_LIMIT]: 2,
                [LICENSE_QUOTAS.USERS_LIMIT]: -1,
                [LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT]: 0
            })
        } as any

        await expect(checkUsageLimit('flows', 'sub_123', usageCacheManager, 2)).resolves.toBeUndefined()

        expect(usageCacheManager.getQuotas).toHaveBeenCalledWith('sub_123')
    })

    it('checks entitlement resource credits before prediction execution', async () => {
        const usageCacheManager = {
            get: jest.fn().mockResolvedValue(0),
            getQuotas: jest.fn().mockResolvedValue({
                [LICENSE_QUOTAS.PREDICTIONS_LIMIT]: -1
            })
        } as any

        await expect(checkPredictions('org_1', 'sub_123', usageCacheManager)).resolves.toEqual({
            credits: { required: 1 }
        })

        expect(mockAssertCreditsAvailable).toHaveBeenCalledWith('org_1', 1)
    })

    it('deducts entitlement resource credits with a caller-provided idempotency key after a prediction succeeds', async () => {
        const usageCacheManager = {
            getQuotas: jest.fn().mockResolvedValue({
                [LICENSE_QUOTAS.PREDICTIONS_LIMIT]: 10
            }),
            get: jest.fn().mockResolvedValue(0),
            getTTL: jest.fn().mockResolvedValue(undefined),
            getSubscriptionDetails: jest.fn().mockResolvedValue({ created: Math.floor(Date.now() / 1000) }),
            set: jest.fn()
        } as any

        await updatePredictionsUsage('org_1', 'sub_123', 'workspace_1', usageCacheManager, 'prediction:chat_1')

        expect(mockConsumeCredits).toHaveBeenCalledWith({
            scopeId: 'org_1',
            action: 'prediction',
            credits: 1,
            idempotencyKey: 'prediction:chat_1',
            metadata: { workspaceId: 'workspace_1' }
        })
    })
})
