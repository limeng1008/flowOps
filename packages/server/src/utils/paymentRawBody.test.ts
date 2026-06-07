import { capturePaymentNotifyRawBody, shouldCapturePaymentNotifyRawBody } from './paymentRawBody'

describe('payment raw body capture', () => {
    it('captures exact raw bytes only for payment notify routes', () => {
        const req: Record<string, unknown> = {
            originalUrl: '/api/v1/payment/notify/alipay',
            path: '/api/v1/payment/notify/alipay'
        }
        const body = Buffer.from('out_trade_no=pay-1&total_amount=99.00&subject=%E4%B8%93%E4%B8%9A%E7%89%88', 'utf8')

        capturePaymentNotifyRawBody(req as any, body)

        expect(Buffer.isBuffer(req.rawBody)).toBe(true)
        expect(Buffer.compare(req.rawBody as Buffer, body)).toBe(0)
        expect(shouldCapturePaymentNotifyRawBody(req as any)).toBe(true)
    })

    it('does not cache raw bytes for non-payment routes', () => {
        const req: Record<string, unknown> = {
            originalUrl: '/api/v1/prediction/abc',
            path: '/api/v1/prediction/abc'
        }

        capturePaymentNotifyRawBody(req as any, Buffer.from('{"question":"hi"}'))

        expect(req.rawBody).toBeUndefined()
        expect(shouldCapturePaymentNotifyRawBody(req as any)).toBe(false)
    })
})
