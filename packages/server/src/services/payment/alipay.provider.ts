import axios from 'axios'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { PaymentOrderProvider } from '../../database/entities/PaymentOrder'
import { CreateOrderInput, CreateOrderResult, PaymentNotification, PaymentProvider } from './types'
import { centsToYuan, currentAlipayTimestamp, getEnv, requireEnv, signRsaSha256, verifyRsaSha256, yuanToCents } from './utils'

export class AlipayProvider implements PaymentProvider {
    private readonly appId: string
    private readonly privateKey: string
    private readonly alipayPublicKey: string
    private readonly gateway: string
    private readonly notifyBaseUrl: string

    constructor() {
        this.appId = requireEnv('ALIPAY_APP_ID', '支付宝')
        this.privateKey = requireEnv('ALIPAY_PRIVATE_KEY', '支付宝')
        this.alipayPublicKey = requireEnv('ALIPAY_PUBLIC_KEY', '支付宝')
        this.gateway = getEnv('ALIPAY_GATEWAY', 'https://openapi.sandbox.dl.alipaydev.com/gateway.do')
        this.notifyBaseUrl = requireEnv('PAYMENT_NOTIFY_BASE_URL', '支付宝')
    }

    async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
        const params: Record<string, string> = {
            app_id: this.appId,
            method: 'alipay.trade.precreate',
            format: 'JSON',
            charset: 'utf-8',
            sign_type: 'RSA2',
            timestamp: currentAlipayTimestamp(),
            version: '1.0',
            notify_url: `${this.notifyBaseUrl.replace(/\/$/, '')}/api/v1/payment/notify/alipay`,
            biz_content: JSON.stringify({
                out_trade_no: input.orderNo,
                total_amount: centsToYuan(input.amountCents),
                subject: input.subject
            })
        }
        const signContent = buildAlipaySignContent(params)
        const response = await axios.get(this.gateway, {
            params: { ...params, sign: signRsaSha256(signContent, this.privateKey) }
        })
        const payload = response.data?.alipay_trade_precreate_response || response.data
        if (!payload?.qr_code) {
            throw new InternalFlowiseError(StatusCodes.BAD_GATEWAY, payload?.sub_msg || payload?.msg || '支付宝下单失败')
        }
        return {
            provider: PaymentOrderProvider.ALIPAY,
            qrCodeUrl: payload.qr_code,
            rawResponse: response.data
        }
    }

    async verifyAndParseNotification(_headers: Record<string, unknown>, rawBody: Buffer): Promise<PaymentNotification> {
        const params = Object.fromEntries(new URLSearchParams(rawBody.toString('utf8')).entries())
        const signature = params.sign
        if (!signature) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'INVALID_PAYMENT_SIGNATURE')
        const signContent = buildAlipaySignContent(params)
        if (!verifyRsaSha256(signContent, signature, this.alipayPublicKey)) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'INVALID_PAYMENT_SIGNATURE')
        }
        return {
            orderNo: params.out_trade_no,
            thirdPartyTxnId: params.trade_no || null,
            amountCents: yuanToCents(params.total_amount),
            success: params.trade_status === 'TRADE_SUCCESS',
            raw: params
        }
    }
}

function buildAlipaySignContent(params: Record<string, string>): string {
    return Object.keys(params)
        .filter((key) => key !== 'sign' && key !== 'sign_type' && params[key] !== undefined && params[key] !== '')
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&')
}
