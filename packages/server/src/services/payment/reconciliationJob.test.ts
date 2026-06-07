import { jest } from '@jest/globals'
import { PaymentOrder, PaymentOrderProvider, PaymentOrderStatus } from '../../database/entities/PaymentOrder'

const mockRepo = {
    find: jest.fn()
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => ({
        AppDataSource: {
            getRepository: jest.fn(() => mockRepo)
        }
    }))
}))

import PaymentService from './index'
import { runPaymentReconciliationOnce } from './reconciliationJob'

describe('payment reconciliation job', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        process.env.PAYMENT_RECONCILIATION_LOOKBACK_HOURS = '6'
        process.env.PAYMENT_RECONCILIATION_BATCH_SIZE = '50'
    })

    it('refreshes recent pending orders in batch order', async () => {
        const order = {
            orderNo: 'pay-1',
            organizationId: 'org-1',
            provider: PaymentOrderProvider.ALIPAY,
            status: PaymentOrderStatus.PENDING,
            createdDate: new Date('2026-06-07T10:00:00.000Z')
        } as PaymentOrder
        mockRepo.find.mockResolvedValueOnce([order] as never)
        const refreshSpy = jest.spyOn(PaymentService as any, 'refreshPendingOrder').mockResolvedValueOnce({
            orderNo: 'pay-1',
            status: PaymentOrderStatus.PAID
        } as any)

        const result = await runPaymentReconciliationOnce(new Date('2026-06-07T12:00:00.000Z'))

        expect(result).toEqual({ scanned: 1, refreshed: 1, failed: 0 })
        expect(mockRepo.find).toHaveBeenCalledWith(
            expect.objectContaining({
                order: { createdDate: 'ASC' },
                take: 50
            })
        )
        expect(refreshSpy).toHaveBeenCalledWith('pay-1', 'org-1', expect.any(Date))
    })
})
