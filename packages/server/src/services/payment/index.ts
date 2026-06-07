import crypto from 'crypto'
import { StatusCodes } from 'http-status-codes'
import { EntityManager } from 'typeorm'
import { BillingPlan } from '../../database/entities/BillingPlan'
import { PaymentNotificationLog } from '../../database/entities/PaymentNotificationLog'
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
        const expireAt = new Date(Date.now() + getOrderTtlMinutes() * 60 * 1000)
        const order = orderRepo.create({
            orderNo,
            organizationId: input.organizationId,
            planCode: plan.code,
            provider: providerName,
            amountCents: plan.monthlyPriceCents,
            currency: plan.currency || 'CNY',
            status: PaymentOrderStatus.PENDING,
            expireAt
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
            expireAt,
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
            await this.logNotification(
                providerKey,
                headers,
                rawBody,
                false,
                extractOrderNoFromRawBody(providerKey, rawBody),
                getErrorMessage(error)
            )
            logger.warn(`[payment] Rejected ${providerKey} notification before order update: ${getErrorMessage(error)}`)
            throw error
        }

        return await getRunningExpressApp().AppDataSource.transaction(async (manager: EntityManager) => {
            await this.logNotification(providerKey, headers, rawBody, true, notification.orderNo, null, manager)
            return await this.applyNotification(providerKey, notification, manager)
        })
    }

    static async getOrderStatus(orderNo: string, organizationId: string) {
        const orderRepo = getRunningExpressApp().AppDataSource.getRepository(PaymentOrder)
        const order = await orderRepo.findOneBy({ orderNo })
        if (!order || order.organizationId !== organizationId)
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.ORDER_NOT_FOUND)
        if (order.status === PaymentOrderStatus.PENDING) {
            return await this.refreshPendingOrder(orderNo, organizationId)
        }
        return serializeOrder(order)
    }

    static async refreshPendingOrder(orderNo: string, organizationId: string, now: Date = new Date()) {
        const appServer = getRunningExpressApp()
        const orderRepo = appServer.AppDataSource.getRepository(PaymentOrder)
        const order = await orderRepo.findOneBy({ orderNo })
        if (!order || order.organizationId !== organizationId)
            throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.ORDER_NOT_FOUND)
        if (order.status !== PaymentOrderStatus.PENDING) return serializeOrder(order)

        const providerKey = normalizeProvider(order.provider)
        const provider = this.getProvider(providerKey)
        let queriedNotification: PaymentNotification | undefined
        try {
            queriedNotification = await provider.queryOrder(order.orderNo)
        } catch (error) {
            logger.warn(`[payment] Active query failed for order ${order.orderNo}: ${getErrorMessage(error)}`)
        }

        if (queriedNotification?.success) {
            const settledOrder = await appServer.AppDataSource.transaction(async (manager: EntityManager) => {
                const lockedOrder = await manager.getRepository(PaymentOrder).findOneBy({ orderNo: order.orderNo })
                if (!lockedOrder) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.ORDER_NOT_FOUND)
                await this.settlePaidOrder(lockedOrder, queriedNotification!, manager)
                return {
                    ...lockedOrder,
                    status: PaymentOrderStatus.PAID,
                    thirdPartyTxnId: queriedNotification!.thirdPartyTxnId || null,
                    paidAt: new Date()
                } as PaymentOrder
            })
            return serializeOrder(settledOrder)
        }

        if (isExpired(order, now)) {
            await this.closeExpiredOrder(order, provider, now)
            return serializeOrder({ ...order, status: PaymentOrderStatus.CLOSED } as PaymentOrder)
        }

        return serializeOrder(order)
    }

    private static async applyNotification(providerKey: PaymentOrderProvider, notification: PaymentNotification, manager: EntityManager) {
        const orderRepo = manager.getRepository(PaymentOrder)
        const order = await orderRepo.findOneBy({ orderNo: notification.orderNo })
        if (!order) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, PaymentErrorCodes.ORDER_NOT_FOUND)
        if (order.provider !== providerKey) throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.PROVIDER_MISMATCH)
        if (order.status === PaymentOrderStatus.PAID) return ack(providerKey)
        if (order.amountCents !== notification.amountCents) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.AMOUNT_MISMATCH)
        }
        if (!notification.success) {
            await orderRepo.update({ orderNo: order.orderNo, status: PaymentOrderStatus.PENDING }, { status: PaymentOrderStatus.FAILED })
            return ack(providerKey)
        }

        await this.settlePaidOrder(order, notification, manager)
        return ack(providerKey)
    }

    private static async settlePaidOrder(order: PaymentOrder, notification: PaymentNotification, manager: EntityManager) {
        if (order.amountCents !== notification.amountCents) {
            throw new InternalFlowiseError(StatusCodes.BAD_REQUEST, PaymentErrorCodes.AMOUNT_MISMATCH)
        }
        const orderRepo = manager.getRepository(PaymentOrder)
        const paidAt = new Date()
        const updateResult = await orderRepo.update(
            { orderNo: order.orderNo, status: PaymentOrderStatus.PENDING },
            {
                status: PaymentOrderStatus.PAID,
                thirdPartyTxnId: notification.thirdPartyTxnId || null,
                paidAt
            }
        )
        if (!updateResult.affected) return

        await BillingService.setOrganizationSubscription(
            {
                organizationId: order.organizationId,
                planId: order.planCode,
                notes: `支付订单 ${order.orderNo} 已支付，渠道 ${order.provider}，交易号 ${notification.thirdPartyTxnId || '-'}`
            },
            manager
        )
    }

    private static async closeExpiredOrder(order: PaymentOrder, provider: PaymentProvider, now: Date) {
        try {
            await provider.closeOrder(order.orderNo)
        } catch (error) {
            logger.warn(`[payment] Close expired order ${order.orderNo} failed: ${getErrorMessage(error)}`)
        }
        await getRunningExpressApp().AppDataSource.transaction(async (manager: EntityManager) => {
            await manager
                .getRepository(PaymentOrder)
                .update(
                    { orderNo: order.orderNo, status: PaymentOrderStatus.PENDING },
                    { status: PaymentOrderStatus.CLOSED, updatedDate: now }
                )
        })
    }

    private static async logNotification(
        provider: PaymentOrderProvider,
        headers: Record<string, unknown>,
        rawBody: Buffer,
        verified: boolean,
        orderNo?: string | null,
        errorMessage?: string | null,
        manager?: EntityManager
    ) {
        const repositorySource = manager || getRunningExpressApp().AppDataSource
        const logRepo = repositorySource.getRepository(PaymentNotificationLog)
        const log = logRepo.create({
            provider,
            orderNo: orderNo || null,
            verified,
            rawBody: rawBody.toString('utf8'),
            headersDigest: digestHeaders(headers),
            errorMessage: errorMessage || null
        })
        await logRepo.save(log)
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
    return provider === PaymentOrderProvider.ALIPAY ? 'success' : { code: 'SUCCESS', message: 'OK' }
}

function getOrderTtlMinutes(): number {
    const parsed = Number(process.env.PAYMENT_ORDER_TTL_MINUTES || 15)
    if (!Number.isFinite(parsed) || parsed <= 0) return 15
    return parsed
}

function isExpired(order: PaymentOrder, now: Date): boolean {
    const expireAt = order.expireAt || (order.createdDate ? new Date(order.createdDate.getTime() + getOrderTtlMinutes() * 60 * 1000) : null)
    return !!expireAt && expireAt.getTime() <= now.getTime()
}

function serializeOrder(order: PaymentOrder) {
    return {
        orderNo: order.orderNo,
        planCode: order.planCode,
        provider: order.provider,
        amountCents: order.amountCents,
        currency: order.currency,
        status: order.status,
        paidAt: order.paidAt || null,
        expireAt: order.expireAt || null
    }
}

function digestHeaders(headers: Record<string, unknown>): string {
    const normalized = Object.keys(headers)
        .sort()
        .reduce<Record<string, string>>((acc, key) => {
            const value = headers[key]
            acc[key.toLowerCase()] = Array.isArray(value) ? value.map(String).join(',') : value == null ? '' : String(value)
            return acc
        }, {})
    return crypto.createHash('sha256').update(JSON.stringify(normalized), 'utf8').digest('hex')
}

function extractOrderNoFromRawBody(provider: PaymentOrderProvider, rawBody: Buffer): string | null {
    if (provider !== PaymentOrderProvider.ALIPAY) return null
    try {
        return new URLSearchParams(rawBody.toString('utf8')).get('out_trade_no')
    } catch {
        return null
    }
}

export default PaymentService
