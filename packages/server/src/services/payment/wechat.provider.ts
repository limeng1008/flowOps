import axios from 'axios'
import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { PaymentOrderProvider } from '../../database/entities/PaymentOrder'
import { CreateOrderInput, CreateOrderResult, PaymentNotification, PaymentProvider } from './types'
import { getEnv, randomNonce, readHeader, requireEnv, signRsaSha256, verifyRsaSha256 } from './utils'

export class WechatProvider implements PaymentProvider {
    private readonly mchId: string
    private readonly appId: string
    private readonly privateKey: string
    private readonly serialNo: string
    private readonly apiV3Key: string
    private readonly platformCert: string
    private readonly notifyBaseUrl: string
    private readonly gateway: string

    constructor() {
        this.mchId = requireEnv('WECHAT_MCH_ID', '微信')
        this.appId = requireEnv('WECHAT_APP_ID', '微信')
        this.privateKey = requireEnv('WECHAT_PRIVATE_KEY', '微信')
        this.serialNo = requireEnv('WECHAT_SERIAL_NO', '微信')
        this.apiV3Key = requireEnv('WECHAT_APIV3_KEY', '微信')
        this.platformCert = requireEnv('WECHAT_PLATFORM_CERT', '微信')
        this.notifyBaseUrl = requireEnv('PAYMENT_NOTIFY_BASE_URL', '微信')
        this.gateway = getEnv('WECHAT_GATEWAY', 'https://api.mch.weixin.qq.com')
    }

    async createOrder(input: CreateOrderInput): Promise<CreateOrderResult> {
        const path = '/v3/pay/transactions/native'
        const endpoint = `${this.gateway.replace(/\/$/, '')}${path}`
        const body = JSON.stringify({
            appid: this.appId,
            mchid: this.mchId,
            description: input.subject,
            out_trade_no: input.orderNo,
            notify_url: `${this.notifyBaseUrl.replace(/\/$/, '')}/api/v1/payment/notify/wechat`,
            amount: {
                total: input.amountCents,
                currency: 'CNY'
            }
        })
        const authorization = this.buildAuthorization('POST', path, body)
        const response = await axios.post(endpoint, body, {
            headers: {
                Authorization: authorization,
                'Content-Type': 'application/json',
                Accept: 'application/json'
            }
        })
        if (!response.data?.code_url) {
            throw new InternalFlowiseError(StatusCodes.BAD_GATEWAY, response.data?.message || '微信支付下单失败')
        }
        return {
            provider: PaymentOrderProvider.WECHAT,
            qrCodeUrl: response.data.code_url,
            rawResponse: response.data
        }
    }

    async verifyAndParseNotification(headers: Record<string, unknown>, rawBody: Buffer): Promise<PaymentNotification> {
        const timestamp = readHeader(headers, 'wechatpay-timestamp')
        const nonce = readHeader(headers, 'wechatpay-nonce')
        const signature = readHeader(headers, 'wechatpay-signature')
        const body = rawBody.toString('utf8')
        if (!timestamp || !nonce || !signature) throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'INVALID_PAYMENT_SIGNATURE')
        const message = `${timestamp}\n${nonce}\n${body}\n`
        if (!verifyRsaSha256(message, signature, this.platformCert)) {
            throw new InternalFlowiseError(StatusCodes.UNAUTHORIZED, 'INVALID_PAYMENT_SIGNATURE')
        }

        const parsed = JSON.parse(body)
        const decrypted = decryptWechatResource(parsed.resource, this.apiV3Key)
        return {
            orderNo: decrypted.out_trade_no,
            thirdPartyTxnId: decrypted.transaction_id || null,
            amountCents: Number(decrypted.amount?.total || 0),
            success: decrypted.trade_state === 'SUCCESS',
            raw: decrypted
        }
    }

    private buildAuthorization(method: string, urlPath: string, body: string): string {
        const timestamp = `${Math.floor(Date.now() / 1000)}`
        const nonce = randomNonce()
        const message = `${method}\n${urlPath}\n${timestamp}\n${nonce}\n${body}\n`
        const signature = signRsaSha256(message, this.privateKey)
        return `WECHATPAY2-SHA256-RSA2048 ${[
            `mchid="${this.mchId}"`,
            `nonce_str="${nonce}"`,
            `timestamp="${timestamp}"`,
            `serial_no="${this.serialNo}"`,
            `signature="${signature}"`
        ].join(',')}`
    }
}

function decryptWechatResource(resource: any, apiV3Key: string): any {
    if (!resource?.ciphertext || !resource?.nonce)
        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, 'Invalid WeChat payment resource')
    const encrypted = Buffer.from(resource.ciphertext, 'base64')
    const authTag = encrypted.subarray(encrypted.length - 16)
    const ciphertext = encrypted.subarray(0, encrypted.length - 16)
    const decipher = crypto.createDecipheriv('aes-256-gcm', Buffer.from(apiV3Key), Buffer.from(resource.nonce))
    if (resource.associated_data) decipher.setAAD(Buffer.from(resource.associated_data))
    decipher.setAuthTag(authTag)
    const plaintext = Buffer.concat([decipher.update(ciphertext), decipher.final()]).toString('utf8')
    return JSON.parse(plaintext)
}
