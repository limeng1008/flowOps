export interface CreateOrderInput {
    orderNo: string
    amountCents: number
    subject: string
    planCode: string
    orgId: string
}

export interface CreateOrderResult {
    provider: string
    qrCodeUrl?: string
    payUrl?: string
    rawResponse: unknown
}

export interface PaymentNotification {
    orderNo: string
    thirdPartyTxnId?: string | null
    amountCents: number
    success: boolean
    raw: unknown
}

export interface PaymentProvider {
    createOrder(input: CreateOrderInput): Promise<CreateOrderResult>
    verifyAndParseNotification(headers: Record<string, unknown>, rawBody: Buffer): Promise<PaymentNotification>
    queryOrder(orderNo: string): Promise<PaymentNotification>
    closeOrder(orderNo: string): Promise<void>
}
