import cron, { ScheduledTask } from 'node-cron'
import { MoreThanOrEqual } from 'typeorm'
import { PaymentOrder, PaymentOrderStatus } from '../../database/entities/PaymentOrder'
import { MODE } from '../../Interface'
import { getErrorMessage } from '../../errors/utils'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import logger from '../../utils/logger'
import PaymentService from '.'

export interface PaymentReconciliationResult {
    scanned: number
    refreshed: number
    failed: number
}

let task: ScheduledTask | undefined

export function startPaymentReconciliationJob(): ScheduledTask | undefined {
    if (process.env.PAYMENT_RECONCILIATION_ENABLED === 'false') return undefined
    if (process.env.MODE === MODE.QUEUE) {
        logger.info('[payment] Reconciliation job is skipped in queue mode')
        return undefined
    }

    const expression = process.env.PAYMENT_RECONCILIATION_CRON || '*/5 * * * *'
    if (!cron.validate(expression)) {
        logger.warn(`[payment] Invalid PAYMENT_RECONCILIATION_CRON "${expression}", reconciliation job skipped`)
        return undefined
    }

    task?.stop()
    task = cron.schedule(expression, () => {
        runPaymentReconciliationOnce().catch((error) => logger.error(`[payment] Reconciliation failed: ${getErrorMessage(error)}`))
    })
    logger.info(`[payment] Reconciliation job registered with cron "${expression}"`)
    return task
}

export async function runPaymentReconciliationOnce(now: Date = new Date()): Promise<PaymentReconciliationResult> {
    const lookbackHours = readPositiveIntEnv('PAYMENT_RECONCILIATION_LOOKBACK_HOURS', 6)
    const batchSize = readPositiveIntEnv('PAYMENT_RECONCILIATION_BATCH_SIZE', 50)
    const since = new Date(now.getTime() - lookbackHours * 60 * 60 * 1000)
    const repo = getRunningExpressApp().AppDataSource.getRepository(PaymentOrder)
    const orders = await repo.find({
        where: {
            status: PaymentOrderStatus.PENDING,
            createdDate: MoreThanOrEqual(since)
        },
        order: { createdDate: 'ASC' },
        take: batchSize
    })

    let refreshed = 0
    let failed = 0
    for (const order of orders) {
        try {
            await PaymentService.refreshPendingOrder(order.orderNo, order.organizationId, now)
            refreshed += 1
        } catch (error) {
            failed += 1
            logger.warn(`[payment] Reconciliation skipped order ${order.orderNo}: ${getErrorMessage(error)}`)
        }
    }

    return { scanned: orders.length, refreshed, failed }
}

function readPositiveIntEnv(name: string, fallback: number): number {
    const parsed = Number(process.env[name] || fallback)
    if (!Number.isInteger(parsed) || parsed <= 0) return fallback
    return parsed
}
