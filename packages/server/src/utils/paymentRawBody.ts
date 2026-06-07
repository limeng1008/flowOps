import { IncomingMessage, ServerResponse } from 'http'

const PAYMENT_NOTIFY_PREFIX = '/api/v1/payment/notify/'

type RawBodyRequest = IncomingMessage & {
    originalUrl?: string
    path?: string
    rawBody?: Buffer
}

export function shouldCapturePaymentNotifyRawBody(req: { originalUrl?: string; path?: string; url?: string }): boolean {
    const candidates = [req.originalUrl, req.path, req.url].filter((value): value is string => !!value)
    return candidates.some((value) => value.startsWith(PAYMENT_NOTIFY_PREFIX))
}

export function capturePaymentNotifyRawBody(req: RawBodyRequest, _resOrBuf: ServerResponse | Buffer, maybeBuf?: Buffer): void {
    const buf = Buffer.isBuffer(_resOrBuf) ? _resOrBuf : maybeBuf
    if (!buf || !shouldCapturePaymentNotifyRawBody(req)) return
    req.rawBody = Buffer.from(buf)
}
