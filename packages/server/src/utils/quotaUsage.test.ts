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
const mockCheckLimit = jest.fn()
const mockAssertBotAllowance = jest.fn()
const mockAssertSeatAllowance = jest.fn()

jest.mock('../services/entitlement', () => ({
    EntitlementService: jest.fn().mockImplementation(() => ({
        assertCreditsAvailable: mockAssertCreditsAvailable,
        consumeCredits: mockConsumeCredits,
        checkLimit: mockCheckLimit
    })),
    getPredictionCreditCost: jest.fn(() => 1)
}))

jest.mock('../services/billing', () => ({
    __esModule: true,
    default: {
        assertBotAllowance: mockAssertBotAllowance,
        assertSeatAllowance: mockAssertSeatAllowance
    }
}))

import { checkPredictions, checkUsageLimit, updatePredictionsUsage } from './quotaUsage'
import { LICENSE_QUOTAS } from './constants'

describe('quotaUsage entitlement quota checks', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('keeps the 5-argument checkUsageLimit signature and delegates organization limits to entitlement', async () => {
        const usageCacheManager = { getQuotas: jest.fn() } as any
        mockCheckLimit.mockResolvedValue({ scopeId: 'org_1', tier: 'team' })

        await expect(checkUsageLimit('flows', 'sub_123', usageCacheManager, 2, 'org_1')).resolves.toBeUndefined()

        expect(mockCheckLimit).toHaveBeenCalledWith('org_1', 'flows', 2)
        expect(usageCacheManager.getQuotas).not.toHaveBeenCalled()
        expect(mockAssertBotAllowance).not.toHaveBeenCalled()
    })

    it('blocks over-limit flow creation with the entitlement error instead of falling through to billing', async () => {
        const error = { statusCode: 402, message: '工作流数量已超出当前权益，请升级套餐' }
        mockCheckLimit.mockRejectedValue(error)

        await expect(checkUsageLimit('flows', 'sub_123', {} as any, 4, 'org_1')).rejects.toMatchObject(error)

        expect(mockAssertBotAllowance).not.toHaveBeenCalled()
    })

    it('falls back to deprecated billing allowance when entitlement lookup is unavailable', async () => {
        mockCheckLimit.mockRejectedValue(new Error('entitlement database unavailable'))

        await expect(checkUsageLimit('users', 'sub_123', {} as any, 4, 'org_1')).resolves.toBeUndefined()

        expect(mockAssertSeatAllowance).toHaveBeenCalledWith('org_1', 4)
    })

    it('falls back to legacy subscription quotas when no organization id is available', async () => {
        const usageCacheManager = {
            getQuotas: jest.fn().mockResolvedValue({
                [LICENSE_QUOTAS.FLOWS_LIMIT]: 2,
                [LICENSE_QUOTAS.USERS_LIMIT]: -1,
                [LICENSE_QUOTAS.ADDITIONAL_SEATS_LIMIT]: 0
            })
        } as any

        await expect(checkUsageLimit('flows', 'sub_123', usageCacheManager, 2)).resolves.toBeUndefined()

        expect(usageCacheManager.getQuotas).toHaveBeenCalledWith('sub_123')
        expect(mockCheckLimit).not.toHaveBeenCalled()
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
        expect(usageCacheManager.getQuotas).not.toHaveBeenCalled()
        expect(usageCacheManager.set).not.toHaveBeenCalled()
    })
})
