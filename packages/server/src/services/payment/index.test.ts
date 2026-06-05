import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import crypto from 'crypto'
import axios from 'axios'
import { StatusCodes } from 'http-status-codes'

const repos = new Map<unknown, any>()
const mockDataSource = {
    getRepository: jest.fn((entity: unknown) => repos.get(entity))
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => ({
        AppDataSource: mockDataSource
    }))
}))

jest.mock('axios')

import PaymentService, { PaymentErrorCodes } from './index'
import { PaymentOrder, PaymentOrderProvider, PaymentOrderStatus } from '../../database/entities/PaymentOrder'
import { BillingPlan } from '../../database/entities/BillingPlan'
import BillingService from '../billing'

const mockedAxios = axios as jest.Mocked<typeof axios>

const makeRepo = (overrides: Record<string, unknown> = {}) => ({
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
    ...overrides
})

const makeRsaPair = () =>
    crypto.generateKeyPairSync('rsa', {
        modulusLength: 2048,
        publicKeyEncoding: { type: 'spki', format: 'pem' },
        privateKeyEncoding: { type: 'pkcs8', format: 'pem' }
    })

describe('payment service', () => {
    let alipayKeys: ReturnType<typeof makeRsaPair>
    let wechatMerchantKeys: ReturnType<typeof makeRsaPair>
    let wechatPlatformKeys: ReturnType<typeof makeRsaPair>

    beforeEach(() => {
        jest.clearAllMocks()
        repos.clear()
        alipayKeys = makeRsaPair()
        wechatMerchantKeys = makeRsaPair()
        wechatPlatformKeys = makeRsaPair()
        mockedAxios.get.mockReset()
        mockedAxios.post.mockReset()
        process.env.ALIPAY_APP_ID = 'alipay-app'
        process.env.ALIPAY_PRIVATE_KEY = alipayKeys.privateKey
        process.env.ALIPAY_PUBLIC_KEY = alipayKeys.publicKey
        process.env.ALIPAY_GATEWAY = 'https://openapi.sandbox.dl.alipaydev.com/gateway.do'
        process.env.WECHAT_MCH_ID = 'mch-1'
        process.env.WECHAT_APP_ID = 'wx-app'
        process.env.WECHAT_PRIVATE_KEY = wechatMerchantKeys.privateKey
        process.env.WECHAT_SERIAL_NO = 'merchant-serial'
        process.env.WECHAT_APIV3_KEY = '0123456789abcdef0123456789abcdef'
        process.env.WECHAT_PLATFORM_CERT = wechatPlatformKeys.publicKey
        process.env.PAYMENT_NOTIFY_BASE_URL = 'https://flowops.example.com'
    })

    it('creates an Alipay sandbox order with amount stored as integer cents', async () => {
        const planRepo = makeRepo({
            findOne: jest.fn(async () => ({ id: 'plan-pro', code: 'pro', name: '专业版', monthlyPriceCents: 9900, currency: 'CNY' }))
        })
        const orderRepo = makeRepo({
            save: jest.fn(async (order: PaymentOrder) => ({ ...order, id: 'order-id' }))
        })
        repos.set(BillingPlan, planRepo)
        repos.set(PaymentOrder, orderRepo)
        mockedAxios.get.mockResolvedValueOnce({
            data: {
                alipay_trade_precreate_response: { code: '10000', qr_code: 'https://qr.alipay.example/123' },
                sign: 'gateway-sign'
            }
        })

        const result = await PaymentService.createOrder({ planCode: 'pro', provider: PaymentOrderProvider.ALIPAY, organizationId: 'org-1' })

        expect(orderRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId: 'org-1',
                planCode: 'pro',
                provider: PaymentOrderProvider.ALIPAY,
                amountCents: 9900,
                currency: 'CNY',
                status: PaymentOrderStatus.PENDING
            })
        )
        expect(result.qrCodeUrl).toBe('https://qr.alipay.example/123')
        expect(mockedAxios.get).toHaveBeenCalledWith(expect.stringContaining('openapi.sandbox.dl.alipaydev.com'), expect.any(Object))
    })

    it('rejects provider creation when required env is missing', async () => {
        delete process.env.ALIPAY_PRIVATE_KEY
        repos.set(
            BillingPlan,
            makeRepo({
                findOne: jest.fn(async () => ({ id: 'plan-pro', code: 'pro', name: '专业版', monthlyPriceCents: 9900, currency: 'CNY' }))
            })
        )
        repos.set(PaymentOrder, makeRepo())

        await expect(
            PaymentService.createOrder({ planCode: 'pro', provider: PaymentOrderProvider.ALIPAY, organizationId: 'org-1' })
        ).rejects.toMatchObject({
            statusCode: StatusCodes.BAD_REQUEST,
            message: expect.stringContaining('未配置支付宝支付')
        })
    })

    it('verifies an Alipay notification before marking the order paid and activating subscription', async () => {
        const order = makePendingOrder({ orderNo: 'pay-1', amountCents: 9900, provider: PaymentOrderProvider.ALIPAY })
        const orderRepo = makeRepo({
            findOneBy: jest.fn(async () => order),
            save: jest.fn(async (value: PaymentOrder) => value)
        })
        repos.set(PaymentOrder, orderRepo)
        const activateSpy = jest.spyOn(BillingService, 'setOrganizationSubscription').mockResolvedValueOnce({ id: 'sub-1' } as any)

        const body = signAlipayNotify(
            {
                out_trade_no: 'pay-1',
                trade_no: 'ali-txn-1',
                trade_status: 'TRADE_SUCCESS',
                total_amount: '99.00'
            },
            alipayKeys.privateKey
        )

        const ack = await PaymentService.handleNotification(PaymentOrderProvider.ALIPAY, {}, Buffer.from(body))

        expect(ack).toBe('success')
        expect(orderRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: PaymentOrderStatus.PAID,
                thirdPartyTxnId: 'ali-txn-1',
                paidAt: expect.any(Date)
            })
        )
        expect(activateSpy).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId: 'org-1',
                planId: 'pro',
                notes: expect.stringContaining('pay-1')
            })
        )
    })

    it('rejects an Alipay notification with an invalid signature and keeps the order unchanged', async () => {
        const order = makePendingOrder({ orderNo: 'pay-1', amountCents: 9900, provider: PaymentOrderProvider.ALIPAY })
        const orderRepo = makeRepo({ findOneBy: jest.fn(async () => order) })
        repos.set(PaymentOrder, orderRepo)

        const body = signAlipayNotify(
            {
                out_trade_no: 'pay-1',
                trade_no: 'ali-txn-1',
                trade_status: 'TRADE_SUCCESS',
                total_amount: '99.00'
            },
            makeRsaPair().privateKey
        )

        await expect(PaymentService.handleNotification(PaymentOrderProvider.ALIPAY, {}, Buffer.from(body))).rejects.toMatchObject({
            statusCode: StatusCodes.UNAUTHORIZED,
            message: PaymentErrorCodes.INVALID_SIGNATURE
        })
        expect(orderRepo.save).not.toHaveBeenCalled()
    })

    it('decrypts and verifies a WeChat notification before marking the order paid', async () => {
        const order = makePendingOrder({ orderNo: 'pay-wx-1', amountCents: 12800, provider: PaymentOrderProvider.WECHAT })
        const orderRepo = makeRepo({
            findOneBy: jest.fn(async () => order),
            save: jest.fn(async (value: PaymentOrder) => value)
        })
        repos.set(PaymentOrder, orderRepo)
        const activateSpy = jest.spyOn(BillingService, 'setOrganizationSubscription').mockResolvedValueOnce({ id: 'sub-1' } as any)
        const { body, headers } = signWechatNotify(
            {
                out_trade_no: 'pay-wx-1',
                transaction_id: 'wx-txn-1',
                trade_state: 'SUCCESS',
                amount: { total: 12800, currency: 'CNY' }
            },
            process.env.WECHAT_APIV3_KEY!,
            wechatPlatformKeys.privateKey
        )

        const ack = await PaymentService.handleNotification(PaymentOrderProvider.WECHAT, headers, Buffer.from(body))

        expect(ack).toEqual({ code: 'SUCCESS' })
        expect(orderRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                status: PaymentOrderStatus.PAID,
                thirdPartyTxnId: 'wx-txn-1'
            })
        )
        expect(activateSpy).toHaveBeenCalledTimes(1)
    })

    it('rejects a WeChat notification when the signed payload amount was tampered', async () => {
        const order = makePendingOrder({ orderNo: 'pay-wx-1', amountCents: 12800, provider: PaymentOrderProvider.WECHAT })
        const orderRepo = makeRepo({
            findOneBy: jest.fn(async () => order)
        })
        repos.set(PaymentOrder, orderRepo)
        const { body, headers } = signWechatNotify(
            {
                out_trade_no: 'pay-wx-1',
                transaction_id: 'wx-txn-1',
                trade_state: 'SUCCESS',
                amount: { total: 9900, currency: 'CNY' }
            },
            process.env.WECHAT_APIV3_KEY!,
            wechatPlatformKeys.privateKey
        )

        await expect(PaymentService.handleNotification(PaymentOrderProvider.WECHAT, headers, Buffer.from(body))).rejects.toMatchObject({
            statusCode: StatusCodes.BAD_REQUEST,
            message: PaymentErrorCodes.AMOUNT_MISMATCH
        })
        expect(orderRepo.save).not.toHaveBeenCalled()
    })

    it('handles duplicate paid notifications idempotently without activating twice', async () => {
        const order = makePendingOrder({ orderNo: 'pay-1', amountCents: 9900, provider: PaymentOrderProvider.ALIPAY })
        const paidOrder = { ...order, status: PaymentOrderStatus.PAID, thirdPartyTxnId: 'ali-txn-1' }
        const orderRepo = makeRepo({
            findOneBy: jest.fn(async () => paidOrder)
        })
        repos.set(PaymentOrder, orderRepo)
        const activateSpy = jest.spyOn(BillingService, 'setOrganizationSubscription').mockResolvedValue({ id: 'sub-1' } as any)
        const body = signAlipayNotify(
            {
                out_trade_no: 'pay-1',
                trade_no: 'ali-txn-1',
                trade_status: 'TRADE_SUCCESS',
                total_amount: '99.00'
            },
            alipayKeys.privateKey
        )

        await expect(PaymentService.handleNotification(PaymentOrderProvider.ALIPAY, {}, Buffer.from(body))).resolves.toBe('success')

        expect(activateSpy).not.toHaveBeenCalled()
        expect(orderRepo.save).not.toHaveBeenCalled()
    })
})

function makePendingOrder(overrides: Partial<PaymentOrder>): PaymentOrder {
    return {
        id: 'order-id',
        orderNo: 'pay-1',
        organizationId: 'org-1',
        planCode: 'pro',
        provider: PaymentOrderProvider.ALIPAY,
        amountCents: 9900,
        currency: 'CNY',
        status: PaymentOrderStatus.PENDING,
        thirdPartyTxnId: null,
        paidAt: null,
        ...overrides
    } as PaymentOrder
}

function signAlipayNotify(params: Record<string, string>, privateKey: string): string {
    const content = Object.keys(params)
        .sort()
        .map((key) => `${key}=${params[key]}`)
        .join('&')
    const sign = crypto.createSign('RSA-SHA256').update(content, 'utf8').sign(privateKey, 'base64')
    return new URLSearchParams({ ...params, sign_type: 'RSA2', sign }).toString()
}

function signWechatNotify(
    resource: Record<string, unknown>,
    apiV3Key: string,
    privateKey: string
): { body: string; headers: Record<string, string> } {
    const nonce = 'nonce-123'
    const aad = 'transaction'
    const nonceValue = 'nonce-iv-123'
    const iv = Buffer.from(nonceValue)
    const cipher = crypto.createCipheriv('aes-256-gcm', Buffer.from(apiV3Key), iv)
    cipher.setAAD(Buffer.from(aad))
    const ciphertext = Buffer.concat([cipher.update(JSON.stringify(resource), 'utf8'), cipher.final()])
    const tag = cipher.getAuthTag()
    const body = JSON.stringify({
        id: 'notify-id',
        create_time: '2026-06-04T12:00:00+08:00',
        event_type: 'TRANSACTION.SUCCESS',
        resource: {
            algorithm: 'AEAD_AES_256_GCM',
            ciphertext: Buffer.concat([ciphertext, tag]).toString('base64'),
            nonce: nonceValue,
            associated_data: aad
        }
    })
    const timestamp = '1780560000'
    const signatureMessage = `${timestamp}\n${nonce}\n${body}\n`
    const signature = crypto.createSign('RSA-SHA256').update(signatureMessage, 'utf8').sign(privateKey, 'base64')
    return {
        body,
        headers: {
            'wechatpay-timestamp': timestamp,
            'wechatpay-nonce': nonce,
            'wechatpay-signature': signature,
            'wechatpay-serial': 'platform-serial'
        }
    }
}
