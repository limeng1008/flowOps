import { StatusCodes } from 'http-status-codes'
import { EntityManager, In } from 'typeorm'
import { Assistant } from '../../database/entities/Assistant'
import { BillingPlan } from '../../database/entities/BillingPlan'
import { BillingSubscription, BillingSubscriptionStatus } from '../../database/entities/BillingSubscription'
import { BillingUsage } from '../../database/entities/BillingUsage'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { Organization } from '../../enterprise/database/entities/organization.entity'
import { OrganizationUser } from '../../enterprise/database/entities/organization-user.entity'
import { Workspace } from '../../enterprise/database/entities/workspace.entity'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'

export type BillingQuotaKey = 'tokens' | 'bots' | 'seats'
export type BillingQuotas = Record<BillingQuotaKey, number>
export type BillingUsageTotals = BillingQuotas

export enum BillingUsageSource {
    PREDICTION = 'prediction'
}

export const BILLING_ERROR_CODES = {
    TOKEN_LIMIT_EXCEEDED: 'TOKEN_LIMIT_EXCEEDED',
    BOT_LIMIT_EXCEEDED: 'BOT_LIMIT_EXCEEDED',
    SEAT_LIMIT_EXCEEDED: 'SEAT_LIMIT_EXCEEDED',
    BILLING_ADMIN_REQUIRED: 'BILLING_ADMIN_REQUIRED'
} as const

export const DEFAULT_FREE_PLAN: BillingPlanDTO = {
    id: 'builtin-free',
    code: 'free',
    name: '免费版',
    description: '默认免费额度',
    quotas: {
        tokens: 100000,
        bots: 3,
        seats: 3
    } as BillingQuotas,
    monthlyPriceCents: 0,
    currency: 'CNY',
    isActive: true
}

export interface BillingPlanDTO {
    id: string
    code: string
    name: string
    description?: string | null
    quotas: BillingQuotas
    monthlyPriceCents: number
    currency: string
    isActive?: boolean
}

export interface BillingOverview {
    organizationId: string
    period: string
    plan: BillingPlanDTO
    subscription: BillingSubscription | null
    quotas: BillingQuotas
    usage: BillingUsageTotals
    exceeded: Record<BillingQuotaKey, boolean>
}

export interface TokenUsage {
    inputTokens: number
    outputTokens: number
    totalTokens: number
}

export interface RecordTokenUsageInput {
    organizationId: string
    workspaceId?: string
    chatflowId?: string
    source: BillingUsageSource
    sourceId?: string
    dedupeKey: string
    usage: TokenUsage
    createdAt?: Date
}

const quotaKeys: BillingQuotaKey[] = ['tokens', 'bots', 'seats']

export function getBillingPeriod(date: Date = new Date()): string {
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    return `${year}-${month}`
}

export function mergeBillingQuotas(planQuotas: Partial<BillingQuotas>, overrides?: Partial<BillingQuotas> | null): BillingQuotas {
    const merged = { ...DEFAULT_FREE_PLAN.quotas, ...normalizeQuotas(planQuotas) }
    if (overrides) Object.assign(merged, normalizeQuotas(overrides))
    return merged
}

export function extractTokenUsage(payload: unknown): TokenUsage {
    const direct = normalizeTokenUsage(readUsageMetadata(payload))
    if (direct.totalTokens > 0 || direct.inputTokens > 0 || direct.outputTokens > 0) return direct

    const usages: TokenUsage[] = []
    const seen = new WeakSet<object>()
    const visit = (value: unknown) => {
        if (!value || typeof value !== 'object') return
        if (seen.has(value)) return
        seen.add(value)

        const usage = normalizeTokenUsage(readUsageMetadata(value))
        if (usage.totalTokens > 0 || usage.inputTokens > 0 || usage.outputTokens > 0) usages.push(usage)

        for (const nested of Object.values(value as Record<string, unknown>)) {
            if (nested && typeof nested === 'object') visit(nested)
        }
    }

    visit(payload)
    return usages.reduce(
        (total, usage) => ({
            inputTokens: total.inputTokens + usage.inputTokens,
            outputTokens: total.outputTokens + usage.outputTokens,
            totalTokens: total.totalTokens + usage.totalTokens
        }),
        { inputTokens: 0, outputTokens: 0, totalTokens: 0 }
    )
}

export function assertBillingAdmin(user?: Express.User): void {
    const admins = (process.env.BILLING_ADMIN_EMAILS || '')
        .split(',')
        .map((email) => email.trim().toLowerCase())
        .filter(Boolean)
    const email = user?.email?.toLowerCase()
    if (!email || !admins.includes(email)) {
        throw new InternalFlowiseError(StatusCodes.FORBIDDEN, BILLING_ERROR_CODES.BILLING_ADMIN_REQUIRED)
    }
}

export class BillingService {
    static async getOrganizationOverview(organizationId: string, period: string = getBillingPeriod()): Promise<BillingOverview> {
        const appServer = getRunningExpressApp()
        const subscriptionRepo = appServer.AppDataSource.getRepository(BillingSubscription)
        const planRepo = appServer.AppDataSource.getRepository(BillingPlan)

        const subscription = await subscriptionRepo.findOne({
            where: { organizationId, status: BillingSubscriptionStatus.ACTIVE },
            order: { updatedDate: 'DESC' }
        })

        let plan: BillingPlanDTO = DEFAULT_FREE_PLAN
        let quotaOverrides: Partial<BillingQuotas> | null = null
        if (subscription) {
            const localPlan = await planRepo.findOne({ where: [{ id: subscription.planId }, { code: subscription.planId }] })
            if (localPlan) plan = toPlanDTO(localPlan)
            quotaOverrides = parseJson<Partial<BillingQuotas> | null>(subscription.quotaOverrides, null)
        }

        const quotas = mergeBillingQuotas(plan.quotas, quotaOverrides)
        const usage = await this.getCurrentUsage(organizationId, period)
        const exceeded = {
            tokens: isLimitExceeded(usage.tokens, quotas.tokens),
            bots: isLimitExceeded(usage.bots, quotas.bots),
            seats: isLimitExceeded(usage.seats, quotas.seats)
        }

        return {
            organizationId,
            period,
            plan,
            subscription: subscription || null,
            quotas,
            usage,
            exceeded
        }
    }

    static async getCurrentUsage(organizationId: string, period: string = getBillingPeriod()): Promise<BillingUsageTotals> {
        const appServer = getRunningExpressApp()
        const usageRepo = appServer.AppDataSource.getRepository(BillingUsage)
        const workspaceRepo = appServer.AppDataSource.getRepository(Workspace)
        const chatFlowRepo = appServer.AppDataSource.getRepository(ChatFlow)
        const assistantRepo = appServer.AppDataSource.getRepository(Assistant)
        const orgUserRepo = appServer.AppDataSource.getRepository(OrganizationUser)

        const usageRows = await usageRepo.find({ where: { organizationId, period } })
        const tokens = usageRows.reduce((sum: number, row: BillingUsage) => sum + safeNumber(row.totalTokens), 0)

        const workspaces = await workspaceRepo.findBy({ organizationId })
        const workspaceIds = workspaces.map((workspace: Workspace) => workspace.id)
        const botWhere = workspaceIds.length ? { workspaceId: In(workspaceIds) } : { workspaceId: In(['__none__']) }
        const [chatflows, assistants, seats] = await Promise.all([
            chatFlowRepo.countBy(botWhere),
            assistantRepo.countBy(botWhere),
            orgUserRepo.countBy({ organizationId })
        ])

        return {
            tokens,
            bots: chatflows + assistants,
            seats
        }
    }

    static async recordTokenUsage(input: RecordTokenUsageInput): Promise<BillingUsage | null> {
        const usage = normalizeTokenUsage(input.usage)
        if (usage.totalTokens <= 0 && usage.inputTokens <= 0 && usage.outputTokens <= 0) return null

        const usageRepo = getRunningExpressApp().AppDataSource.getRepository(BillingUsage)
        const existing = await usageRepo.findOneBy({ dedupeKey: input.dedupeKey })
        if (existing) return existing

        const entity = usageRepo.create({
            organizationId: input.organizationId,
            workspaceId: input.workspaceId || null,
            chatflowId: input.chatflowId || null,
            source: input.source,
            sourceId: input.sourceId || null,
            dedupeKey: input.dedupeKey,
            period: getBillingPeriod(input.createdAt),
            inputTokens: usage.inputTokens,
            outputTokens: usage.outputTokens,
            totalTokens: usage.totalTokens
        })
        return await usageRepo.save(entity)
    }

    static async assertTokenAllowance(organizationId: string): Promise<void> {
        const overview = await this.getOrganizationOverview(organizationId)
        assertLimit('tokens', overview.usage.tokens, overview.quotas.tokens)
    }

    static async assertBotAllowance(organizationId: string, nextUsage?: number): Promise<void> {
        const overview = await this.getOrganizationOverview(organizationId)
        assertLimit('bots', nextUsage ?? overview.usage.bots, overview.quotas.bots)
    }

    static async assertSeatAllowance(organizationId: string, nextUsage?: number): Promise<void> {
        const overview = await this.getOrganizationOverview(organizationId)
        assertLimit('seats', nextUsage ?? overview.usage.seats, overview.quotas.seats)
    }

    static async listPlans(): Promise<BillingPlanDTO[]> {
        const repo = getRunningExpressApp().AppDataSource.getRepository(BillingPlan)
        const rows = await repo.find({ order: { monthlyPriceCents: 'ASC', createdDate: 'ASC' } })
        return rows.map(toPlanDTO)
    }

    static async upsertPlan(input: Partial<BillingPlanDTO> & { code: string; name: string; quotas: Partial<BillingQuotas> }) {
        const repo = getRunningExpressApp().AppDataSource.getRepository(BillingPlan)
        const existing = await repo.findOneBy({ code: input.code })
        const entity = repo.create({
            ...(existing || {}),
            code: input.code,
            name: input.name,
            description: input.description ?? existing?.description ?? null,
            quotas: JSON.stringify(mergeBillingQuotas(input.quotas)),
            monthlyPriceCents: safeNumber(input.monthlyPriceCents ?? existing?.monthlyPriceCents ?? 0),
            currency: input.currency || existing?.currency || 'CNY',
            isActive: input.isActive ?? existing?.isActive ?? true
        })
        return toPlanDTO(await repo.save(entity))
    }

    static async setOrganizationSubscription(
        input: {
            organizationId: string
            planId: string
            currentPeriodEnd?: string | Date | null
            quotaOverrides?: Partial<BillingQuotas> | null
            notes?: string | null
        },
        manager?: EntityManager
    ): Promise<BillingSubscription> {
        const appServer = getRunningExpressApp()
        const repositorySource = manager || appServer.AppDataSource
        const subscriptionRepo = repositorySource.getRepository(BillingSubscription)
        const planRepo = repositorySource.getRepository(BillingPlan)
        const plan = await planRepo.findOne({ where: [{ id: input.planId }, { code: input.planId }] })
        if (!plan) throw new InternalFlowiseError(StatusCodes.NOT_FOUND, 'BILLING_PLAN_NOT_FOUND')

        const existingSubscriptions = await subscriptionRepo.find({
            where: { organizationId: input.organizationId, status: BillingSubscriptionStatus.ACTIVE }
        })
        for (const subscription of existingSubscriptions) {
            subscription.status = BillingSubscriptionStatus.CANCELED
            await subscriptionRepo.save(subscription)
        }

        const entity = subscriptionRepo.create({
            organizationId: input.organizationId,
            planId: plan.id,
            status: BillingSubscriptionStatus.ACTIVE,
            currentPeriodStart: new Date(),
            currentPeriodEnd: input.currentPeriodEnd ? new Date(input.currentPeriodEnd) : undefined,
            quotaOverrides: input.quotaOverrides ? JSON.stringify(normalizeQuotas(input.quotaOverrides)) : null,
            notes: input.notes || null
        })
        return await subscriptionRepo.save(entity)
    }

    static async cancelOrganizationSubscription(organizationId: string): Promise<{ canceled: number }> {
        const subscriptionRepo = getRunningExpressApp().AppDataSource.getRepository(BillingSubscription)
        const activeSubscriptions = await subscriptionRepo.find({
            where: { organizationId, status: BillingSubscriptionStatus.ACTIVE }
        })
        for (const subscription of activeSubscriptions) {
            subscription.status = BillingSubscriptionStatus.CANCELED
            await subscriptionRepo.save(subscription)
        }
        return { canceled: activeSubscriptions.length }
    }

    static async listOrganizationsWithBilling(): Promise<Array<BillingOverview & { organizationName: string }>> {
        const orgRepo = getRunningExpressApp().AppDataSource.getRepository(Organization)
        const organizations = await orgRepo.find({ order: { createdDate: 'DESC' } })
        const overviews = []
        for (const org of organizations) {
            const overview = await this.getOrganizationOverview(org.id)
            overviews.push({ ...overview, organizationName: org.name })
        }
        return overviews
    }
}

function toPlanDTO(plan: BillingPlan | typeof DEFAULT_FREE_PLAN): BillingPlanDTO {
    return {
        id: plan.id,
        code: plan.code,
        name: plan.name,
        description: plan.description,
        quotas: typeof plan.quotas === 'string' ? mergeBillingQuotas(parseJson<Partial<BillingQuotas>>(plan.quotas, {})) : plan.quotas,
        monthlyPriceCents: plan.monthlyPriceCents,
        currency: plan.currency,
        isActive: plan.isActive
    }
}

function readUsageMetadata(payload: unknown): Record<string, unknown> | undefined {
    if (!payload || typeof payload !== 'object') return undefined
    const object = payload as Record<string, unknown>
    return (object.usageMetadata || object.usage_metadata || object.usage) as Record<string, unknown> | undefined
}

function normalizeTokenUsage(value: unknown): TokenUsage {
    const usage = (value || {}) as Record<string, unknown>
    const inputTokens = safeNumber(usage.inputTokens ?? usage.input_tokens ?? usage.prompt_tokens ?? usage.promptTokens)
    const outputTokens = safeNumber(usage.outputTokens ?? usage.output_tokens ?? usage.completion_tokens ?? usage.completionTokens)
    const totalTokens = safeNumber(usage.totalTokens ?? usage.total_tokens ?? usage.total_tokens_count) || inputTokens + outputTokens
    return { inputTokens, outputTokens, totalTokens }
}

function normalizeQuotas(quotas: Partial<BillingQuotas> = {}): Partial<BillingQuotas> {
    return quotaKeys.reduce((acc, key) => {
        if (quotas[key] !== undefined && quotas[key] !== null) acc[key] = safeNumber(quotas[key])
        return acc
    }, {} as Partial<BillingQuotas>)
}

function parseJson<T>(value: string | null | undefined, fallback: T): T {
    if (!value) return fallback
    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}

function safeNumber(value: unknown): number {
    const number = Number(value)
    return Number.isFinite(number) ? number : 0
}

function isLimitExceeded(usage: number, limit: number): boolean {
    if (limit === -1) return false
    return usage > limit
}

function assertLimit(type: BillingQuotaKey, usage: number, limit: number): void {
    if (limit === -1) return
    const exceeded = type === 'tokens' ? usage >= limit : usage > limit
    if (!exceeded) return
    const code =
        type === 'tokens'
            ? BILLING_ERROR_CODES.TOKEN_LIMIT_EXCEEDED
            : type === 'bots'
            ? BILLING_ERROR_CODES.BOT_LIMIT_EXCEEDED
            : BILLING_ERROR_CODES.SEAT_LIMIT_EXCEEDED
    throw new InternalFlowiseError(StatusCodes.PAYMENT_REQUIRED, code)
}

export default BillingService
