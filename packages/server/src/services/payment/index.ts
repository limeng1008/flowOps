import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { BillingPlan } from '../../database/entities/BillingPlan'
import { PaymentOrder, PaymentOrderProvider, PaymentOrderStatus } from '../../database/entities/PaymentOrder'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import logger from '../../utils/logger'
import BillingService from '../billing'
import { AlipayProvider } from './alipay.provider'
import { PaymentNotification, PaymentProvider } from './types'
import { assertIntegerCents } from './utils'
import { WechatProvider } from './wechat.provider'

export const PaymentErrorCodes = {
    INVALID_SIGNATURE: 'INVALID_PAYMENT_SIGNATURE',
    AMOUNT_MISMATCH: 'PAYMENT_AMOUNT_MISMATCH',
    ORDER_NOT_FOUND: 'PAYMENT_ORDER_NOT_FOUND',
    PLAN_NOT_FOUND: 'PAYMENT_PLAN_NOT_FOUND',
    PROVIDER_MISMATCH: 'PAYMENT_PROVIDER_MISMATCH',
    UNSUPPORTED_PROVIDER: 'PAYMENT_PROVIDER_UNSUPPORTED'
} as const

export interface CreatePaymentOrderInput {
    planCode: string
    provider: PaymentOrderProvider | string
    organizationId: string
}

export class PaymentService {
    static getProvider(provider: PaymentOrderProvider | string): PaymentProvider {
        if (provider === PaymentOrderProvider.ALIPAY) return new AlipayProvider()
        if (provider === PaymentOrderProvider.WECHAT) return new WechatProvider()
        throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.UNSUPPORTED_PROVIDER)
    }

    static async createOrder(input: CreatePaymentOrderInput) {
        const providerName = normalizeProvider(input.provider)
        const provider = this.getProvider(providerName)
        const planRepo = getRunningExpressApp().AppDataSource.getRepository(BillingPlan)
        const orderRepo = getRunningExpressApp().AppDataSource.getRepository(PaymentOrder)
        const plan = await planRepo.findOne({ where: [{ code: input.planCode }, { id: input.planCode }] })
        if (!plan) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.PLAN_NOT_FOUND)
        assertIntegerCents(plan.monthlyPriceCents)

        const orderNo = createOrderNo()
        const order = orderRepo.create({
            orderNo,
            organizationId: input.organizationId,
            planCode: plan.code,
            provider: providerName,
            amountCents: plan.monthlyPriceCents,
            currency: plan.currency || 'CNY',
            status: PaymentOrderStatus.PENDING
        })
        await orderRepo.save(order)

        const providerResult = await provider.createOrder({
            orderNo,
            amountCents: plan.monthlyPriceCents,
            subject: `FlowOps ${plan.name}`,
            planCode: plan.code,
            orgId: input.organizationId
        })
        return {
            orderNo,
            status: PaymentOrderStatus.PENDING,
            amountCents: plan.monthlyPriceCents,
            currency: plan.currency || 'CNY',
            ...providerResult
        }
    }

    static async handleNotification(providerName: PaymentOrderProvider | string, headers: Record<string, unknown>, rawBody: Buffer) {
        const providerKey = normalizeProvider(providerName)
        const provider = this.getProvider(providerKey)
        let notification: PaymentNotification
        try {
            notification = await provider.verifyAndParseNotification(headers, rawBody)
        } catch (error) {
            logger.warn(`[payment] Rejected ${providerKey} notification before order update: ${getErrorMessage(error)}`)
            throw error
        }
        const orderRepo = getRunningExpressApp().AppDataSource.getRepository(PaymentOrder)
        const order = await orderRepo.findOneBy({ orderNo: notification.orderNo })
        if (!order) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.ORDER_NOT_FOUND)
        if (order.provider !== providerKey) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.PROVIDER_MISMATCH)
        if (order.status === PaymentOrderStatus.PAID) return ack(providerKey)
        if (order.amountCents !== notification.amountCents) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.AMOUNT_MISMATCH)
        }
        if (!notification.success) {
            order.status = PaymentOrderStatus.FAILED
            await orderRepo.save(order)
            return ack(providerKey)
        }

        order.status = PaymentOrderStatus.PAID
        order.thirdPartyTxnId = notification.thirdPartyTxnId || null
        order.paidAt = new Date()
        await orderRepo.save(order)
        await BillingService.setOrganizationSubscription({
            organizationId: order.organizationId,
            planId: order.planCode,
            notes: `支付订单 ${order.orderNo} 已支付，渠道 ${order.provider}，交易号 ${order.thirdPartyTxnId || '-'}`
        })
        return ack(providerKey)
    }

    static async getOrderStatus(orderNo: string, organizationId: string) {
        const orderRepo = getRunningExpressApp().AppDataSource.getRepository(PaymentOrder)
        const order = await orderRepo.findOneBy({ orderNo })
        if (!order || order.organizationId !== organizationId)
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.ORDER_NOT_FOUND)
        return {
            orderNo: order.orderNo,
            planCode: order.planCode,
            provider: order.provider,
            amountCents: order.amountCents,
            currency: order.currency,
            status: order.status,
            paidAt: order.paidAt || null
        }
    }
}

function normalizeProvider(provider: PaymentOrderProvider | string): PaymentOrderProvider {
    if (provider === PaymentOrderProvider.ALIPAY || provider === PaymentOrderProvider.WECHAT) return provider
    throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.UNSUPPORTED_PROVIDER)
}

function createOrderNo(): string {
    return `FO${Date.now()}${crypto.randomBytes(5).toString('hex')}`
}

function ack(provider: PaymentOrderProvider) {
    return provider === PaymentOrderProvider.ALIPAY ? 'success' : { code: 'SUCCESS' }
}

export default PaymentService
