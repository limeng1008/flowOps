jest.mock('./constants', () => ({
    LICENSE_QUOTAS: {
        FLOWS_LIMIT: 'quota:flows',
        USERS_LIMIT: 'quota:users',
        ADDITIONAL_SEATS_LIMIT: 'quota:additionalSeats',
        PREDICTIONS_LIMIT: 'quota:predictions',
        STORAGE_LIMIT: 'quota:storage'
    }
}))

import { checkUsageLimit } from './quotaUsage'
import { LICENSE_QUOTAS } from './constants'

describe('quotaUsage Stripe quota checks', () => {
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
})
