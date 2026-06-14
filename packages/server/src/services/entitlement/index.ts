import { StatusCodes } from 'http-status-codes'
import { Between, DataSource, EntityManager, MoreThanOrEqual } from 'typeorm'
import { BillingPlan } from '../../database/entities/BillingPlan'
import { BillingSubscription, BillingSubscriptionStatus } from '../../database/entities/BillingSubscription'
import { Entitlement } from '../../database/entities/Entitlement'
import { EntitlementUsage } from '../../database/entities/EntitlementUsage'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import LicenseService, { LicenseService as FlowOpsLicenseService, LicenseVerificationResult } from '../license'

export type FlowOpsEdition = 'cloud' | 'private'
export type EntitlementTier = 'free' | 'pro' | 'team' | 'enterprise'
export type EntitlementSourceKind = 'local' | 'subscription'
export type EntitlementLimitDimension = 'flows' | 'users' | 'credits' | 'predictions'

export const ENTITLEMENT_TIERS: EntitlementTier[] = ['free', 'pro', 'team', 'enterprise']

export const isEntitlementTier = (value: unknown): value is EntitlementTier => {
    return ENTITLEMENT_TIERS.includes(`${value ?? ''}`.trim().toLowerCase() as EntitlementTier)
}

export const inferEntitlementTierFromPlanCode = (planCode?: string | null): EntitlementTier => {
    const code = `${planCode ?? ''}`.trim().toLowerCase()
    if (!code) return 'free'
    if (code.startsWith('local_dev') || code.includes('enterprise')) return 'enterprise'
    if (code.includes('team')) return 'team'
    if (code === 'pro' || code.includes('_pro') || code.includes('-pro')) return 'pro'
    if (code.includes('free')) return 'free'
    return 'free'
}

export const normalizeEntitlementTier = (value: unknown, fallbackPlanCode?: string | null): EntitlementTier => {
    const normalized = `${value ?? ''}`.trim().toLowerCase()
    return isEntitlementTier(normalized) ? normalized : inferEntitlementTierFromPlanCode(fallbackPlanCode)
}

export interface EntitlementSnapshot {
    scopeId: string
    tier: EntitlementTier
    seats: number
    creditsTotal: number
    creditsBalance: number
    features: string[]
    concurrency: number
    expireAt?: Date | null
    source: EntitlementSourceKind
    readOnly?: boolean
    licenseId?: string
    licenseCustomer?: string
    licenseStatus?: string
}

export interface EntitlementTemplate {
    tier: EntitlementTier
    seats: number
    creditsTotal: number
    creditsBalance: number
    features: string[]
    concurrency: number
}

export interface EntitlementSource {
    resolve(scopeId: string): Promise<EntitlementSnapshot>
}

export interface CreditConsumptionRequest {
    scopeId: string
    idempotencyKey: string
    action: string
    credits: number
    metadata?: Record<string, unknown>
}

export interface EntitlementPlanCatalogItem extends EntitlementTemplate {
    spaces: number
    privateDeployment: 'available' | 'optional' | 'unavailable'
    sourceOptions: string[]
}

export interface EntitlementUsageSummaryItem {
    action: string
    credits: number
}

export interface EntitlementBillingCenterOverview {
    edition: FlowOpsEdition
    period: string
    entitlement: EntitlementSnapshot
    plans: EntitlementPlanCatalogItem[]
    resourceUsage: {
        period: string
        totalCredits: number
        byAction: EntitlementUsageSummaryItem[]
    }
}

export interface EntitlementBillingCenterOverviewOptions {
    env?: NodeJS.ProcessEnv | Record<string, string | undefined>
    now?: Date
}

export interface CreditConsumptionResult {
    deducted: boolean
    credits: number
    creditsBalance: number
    entitlement: EntitlementSnapshot
}

export const ENTITLEMENT_ERROR_MESSAGES = {
    insufficientCredits: '资源点不足，请充值/升级',
    featureRequired: '该功能需专业版',
    flowLimitExceeded: '工作流数量已超出当前权益，请升级套餐',
    seatLimitExceeded: '席位数量已超出当前权益，请升级套餐'
}

export const FLOWOPS_ENTITLEMENT_FEATURES = {
    basicWorkflow: 'basic-workflow',
    chinaModels: 'china-models',
    pptExcelExport: 'ppt-excel-export',
    contentSafety: 'content-safety',
    humanHandoff: 'human-handoff',
    traceDebugging: 'trace-debugging',
    chinaCloudVectorStores: 'china-cloud-vector-stores',
    multiWorkspace: 'multi-workspace',
    ssoAuditLogs: 'sso-audit-logs',
    privateOfflineLicense: 'private-offline-license',
    customBranding: 'custom-branding',
    apiAccess: 'api-access'
} as const

const FREE_FEATURES = [
    FLOWOPS_ENTITLEMENT_FEATURES.basicWorkflow,
    FLOWOPS_ENTITLEMENT_FEATURES.chinaModels,
    FLOWOPS_ENTITLEMENT_FEATURES.apiAccess
]

const PRO_FEATURES = [
    ...FREE_FEATURES,
    FLOWOPS_ENTITLEMENT_FEATURES.pptExcelExport,
    FLOWOPS_ENTITLEMENT_FEATURES.contentSafety,
    FLOWOPS_ENTITLEMENT_FEATURES.traceDebugging
]

const TEAM_FEATURES = [
    ...PRO_FEATURES,
    FLOWOPS_ENTITLEMENT_FEATURES.humanHandoff,
    FLOWOPS_ENTITLEMENT_FEATURES.chinaCloudVectorStores,
    FLOWOPS_ENTITLEMENT_FEATURES.multiWorkspace,
    FLOWOPS_ENTITLEMENT_FEATURES.customBranding
]

export const ENTITLEMENT_TEMPLATES: Record<EntitlementTier, EntitlementTemplate> = {
    free: {
        tier: 'free',
        seats: 1,
        creditsTotal: 200,
        creditsBalance: 200,
        features: FREE_FEATURES,
        concurrency: 1
    },
    pro: {
        tier: 'pro',
        seats: 5,
        creditsTotal: 5000,
        creditsBalance: 5000,
        features: PRO_FEATURES,
        concurrency: 3
    },
    team: {
        tier: 'team',
        seats: 20,
        creditsTotal: 30000,
        creditsBalance: 30000,
        features: TEAM_FEATURES,
        concurrency: 10
    },
    enterprise: {
        tier: 'enterprise',
        seats: -1,
        creditsTotal: -1,
        creditsBalance: -1,
        features: Object.values(FLOWOPS_ENTITLEMENT_FEATURES),
        concurrency: -1
    }
}

const ENTITLEMENT_PLAN_META: Record<EntitlementTier, Pick<EntitlementPlanCatalogItem, 'spaces' | 'privateDeployment' | 'sourceOptions'>> = {
    free: {
        spaces: 1,
        privateDeployment: 'unavailable',
        sourceOptions: ['default']
    },
    pro: {
        spaces: 3,
        privateDeployment: 'unavailable',
        sourceOptions: ['subscription', 'license']
    },
    team: {
        spaces: 10,
        privateDeployment: 'optional',
        sourceOptions: ['subscription', 'license']
    },
    enterprise: {
        spaces: -1,
        privateDeployment: 'available',
        sourceOptions: ['license']
    }
}

export const getFlowOpsEdition = (env: NodeJS.ProcessEnv = process.env): FlowOpsEdition => {
    const edition = `${env.FLOWOPS_EDITION ?? env.EDITION ?? ''}`.trim().toLowerCase()
    return edition === 'cloud' ? 'cloud' : 'private'
}

export const getEntitlementPlanCatalog = (): EntitlementPlanCatalogItem[] =>
    (['free', 'pro', 'team', 'enterprise'] as EntitlementTier[]).map((tier) => ({
        ...ENTITLEMENT_TEMPLATES[tier],
        ...ENTITLEMENT_PLAN_META[tier]
    }))

export const isLocalCommercialEnabled = (env: NodeJS.ProcessEnv = process.env): boolean => {
    const value = env.FLOWOPS_LOCAL_COMMERCIAL?.trim().toLowerCase()
    return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

export const getPredictionCreditCost = (modelName?: string): number => {
    const defaultCredits = Number(process.env.FLOWOPS_DEFAULT_PREDICTION_CREDITS ?? 1)
    const chinaModelCredits = Number(process.env.FLOWOPS_CHINA_MODEL_CREDITS ?? 2)
    const premiumModelCredits = Number(process.env.FLOWOPS_PREMIUM_MODEL_CREDITS ?? 5)
    const normalizedModelName = (modelName ?? '').toLowerCase()

    if (/(gpt|claude|anthropic|gemini)/.test(normalizedModelName)) return premiumModelCredits
    if (/(qwen|deepseek|ernie|wenxin|glm|moonshot|kimi|yi-)/.test(normalizedModelName)) return chinaModelCredits
    return defaultCredits
}

export const parseEntitlementFeatures = (features: string | string[] | null | undefined): string[] => {
    if (Array.isArray(features)) return features
    if (!features) return []
    try {
        const parsed = JSON.parse(features)
        return Array.isArray(parsed) ? parsed.filter((feature) => typeof feature === 'string') : []
    } catch {
        return features
            .split(',')
            .map((feature) => feature.trim())
            .filter(Boolean)
    }
}

export const toEntitlementSnapshot = (entitlement: Entitlement): EntitlementSnapshot => ({
    scopeId: entitlement.scopeId,
    tier: entitlement.tier as EntitlementTier,
    seats: entitlement.seats,
    creditsTotal: entitlement.creditsTotal,
    creditsBalance: entitlement.creditsBalance,
    features: parseEntitlementFeatures(entitlement.features),
    concurrency: entitlement.concurrency,
    expireAt: entitlement.expireAt,
    source: entitlement.source as EntitlementSourceKind
})

const snapshotToEntity = (snapshot: EntitlementSnapshot): Partial<Entitlement> => ({
    scopeId: snapshot.scopeId,
    tier: snapshot.tier,
    seats: snapshot.seats,
    creditsTotal: snapshot.creditsTotal,
    creditsBalance: snapshot.creditsBalance,
    features: JSON.stringify(snapshot.features),
    concurrency: snapshot.concurrency,
    expireAt: snapshot.expireAt ?? null,
    source: snapshot.source
})

const templateSnapshot = (scopeId: string, tier: EntitlementTier, source: EntitlementSourceKind): EntitlementSnapshot => {
    const template = ENTITLEMENT_TEMPLATES[tier]
    return {
        scopeId,
        tier: template.tier,
        seats: template.seats,
        creditsTotal: template.creditsTotal,
        creditsBalance: template.creditsBalance,
        features: template.features,
        concurrency: template.concurrency,
        expireAt: null,
        source
    }
}

export class LocalEntitlementSource implements EntitlementSource {
    constructor(
        private readonly env: NodeJS.ProcessEnv = process.env,
        private readonly licenseService: Pick<FlowOpsLicenseService, 'getActiveLicense'> = LicenseService
    ) {}

    async resolve(scopeId: string): Promise<EntitlementSnapshot> {
        const licenseEntitlement = await new LicenseEntitlementSource(this.licenseService).resolve(scopeId)
        if (isLicenseBackedSnapshot(licenseEntitlement)) {
            return licenseEntitlement
        }

        return templateSnapshot(scopeId, isLocalCommercialEnabled(this.env) ? 'enterprise' : 'free', 'local')
    }
}

export class LicenseEntitlementSource implements EntitlementSource {
    constructor(private readonly licenseService: Pick<FlowOpsLicenseService, 'getActiveLicense'> = LicenseService) {}

    async resolve(scopeId: string): Promise<EntitlementSnapshot> {
        const license = await this.licenseService.getActiveLicense()
        if (!license.valid && license.status !== 'expired') {
            return templateSnapshot(scopeId, 'free', 'local')
        }
        if (license.status === 'expired' && !license.payload) return templateSnapshot(scopeId, 'free', 'local')

        return licenseToEntitlement(scopeId, license)
    }
}

export class SubscriptionEntitlementSource implements EntitlementSource {
    constructor(private readonly dataSource?: DataSource) {}

    async resolve(scopeId: string): Promise<EntitlementSnapshot> {
        const dataSource = this.dataSource ?? getRunningExpressApp().AppDataSource
        const subscription = await dataSource.getRepository(BillingSubscription).findOne({
            where: { organizationId: scopeId, status: BillingSubscriptionStatus.ACTIVE },
            order: { updatedDate: 'DESC' }
        })

        if (!subscription || subscription.status !== BillingSubscriptionStatus.ACTIVE) {
            return templateSnapshot(scopeId, 'free', 'subscription')
        }

        const plan = await dataSource
            .getRepository(BillingPlan)
            .findOne({ where: [{ id: subscription.planId }, { code: subscription.planId }] })
        if (!plan) return templateSnapshot(scopeId, 'free', 'subscription')

        return billingPlanToSubscriptionEntitlement(scopeId, plan)
    }
}

export const createEntitlementSource = (env: NodeJS.ProcessEnv = process.env): EntitlementSource => {
    return getFlowOpsEdition(env) === 'cloud' ? new SubscriptionEntitlementSource() : new LocalEntitlementSource(env)
}

const licenseToEntitlement = (scopeId: string, license: LicenseVerificationResult): EntitlementSnapshot => {
    const tier = (license.tier || 'enterprise') as EntitlementTier
    const template = ENTITLEMENT_TEMPLATES[tier] || ENTITLEMENT_TEMPLATES.enterprise
    const creditsTotal = license.payload?.creditsTotal ?? template.creditsTotal
    const features = license.features.length ? license.features : template.features

    return {
        scopeId,
        tier,
        seats: license.seats ?? template.seats,
        creditsTotal,
        creditsBalance: creditsTotal === -1 ? -1 : creditsTotal,
        features,
        concurrency: license.concurrency ?? template.concurrency,
        expireAt: license.expireAt ?? null,
        source: 'local',
        readOnly: license.readOnly,
        licenseId: license.licenseId,
        licenseCustomer: license.customer,
        licenseStatus: license.status
    }
}

const billingPlanToSubscriptionEntitlement = (scopeId: string, plan: BillingPlan): EntitlementSnapshot => {
    const tier = normalizeEntitlementTier(plan.entitlementTier, plan.code)
    const template = ENTITLEMENT_TEMPLATES[tier]
    const quotas = parseJson<Record<string, unknown>>(plan.quotas, {})
    const creditsTotal = readQuotaNumber(quotas.creditsTotal ?? quotas.credits ?? quotas.tokens) ?? template.creditsTotal
    const features = parseEntitlementFeatures(quotas.features as string | string[] | null | undefined)

    return {
        scopeId,
        tier,
        seats: readQuotaNumber(quotas.seats) ?? template.seats,
        creditsTotal,
        creditsBalance: creditsTotal === -1 ? -1 : creditsTotal,
        features: features.length ? features : template.features,
        concurrency: readQuotaNumber(quotas.concurrency ?? quotas.flows ?? quotas.bots) ?? template.concurrency,
        expireAt: null,
        source: 'subscription'
    }
}

const parseJson = <T>(value: string | null | undefined, fallback: T): T => {
    if (!value) return fallback
    try {
        return JSON.parse(value) as T
    } catch {
        return fallback
    }
}

const readQuotaNumber = (value: unknown): number | undefined => {
    if (value === undefined || value === null || value === '') return undefined
    const number = Number(value)
    return Number.isFinite(number) ? number : undefined
}

const isLicenseBackedSnapshot = (snapshot: EntitlementSnapshot): boolean => {
    return snapshot.licenseStatus === 'active' || snapshot.licenseStatus === 'grace' || snapshot.licenseStatus === 'expired'
}

const shouldRefreshSubscriptionEntitlement = (existing: Entitlement, sourceSnapshot: EntitlementSnapshot): boolean => {
    if (sourceSnapshot.source !== 'subscription') return false
    const existingSnapshot = toEntitlementSnapshot(existing)
    return (
        existingSnapshot.source !== sourceSnapshot.source ||
        existingSnapshot.tier !== sourceSnapshot.tier ||
        existingSnapshot.seats !== sourceSnapshot.seats ||
        existingSnapshot.creditsTotal !== sourceSnapshot.creditsTotal ||
        existingSnapshot.concurrency !== sourceSnapshot.concurrency ||
        (existingSnapshot.expireAt?.getTime() ?? null) !== (sourceSnapshot.expireAt?.getTime() ?? null) ||
        JSON.stringify(existingSnapshot.features) !== JSON.stringify(sourceSnapshot.features)
    )
}

export const consumeCreditsForEntitlement = async (
    manager: EntityManager,
    entitlement: Entitlement,
    request: CreditConsumptionRequest
): Promise<CreditConsumptionResult> => {
    if (request.credits <= 0) {
        return {
            deducted: false,
            credits: 0,
            creditsBalance: entitlement.creditsBalance,
            entitlement: toEntitlementSnapshot(entitlement)
        }
    }

    const existingUsage = await manager.findOne(EntitlementUsage, {
        where: {
            scopeId: request.scopeId,
            idempotencyKey: request.idempotencyKey
        }
    })

    if (existingUsage) {
        const currentEntitlement = (await manager.findOneBy(Entitlement, { id: existingUsage.entitlementId })) ?? entitlement
        return {
            deducted: false,
            credits: existingUsage.credits,
            creditsBalance: currentEntitlement.creditsBalance,
            entitlement: toEntitlementSnapshot(currentEntitlement)
        }
    }

    await manager.insert(EntitlementUsage, {
        entitlementId: entitlement.id,
        scopeId: request.scopeId,
        idempotencyKey: request.idempotencyKey,
        action: request.action,
        credits: request.credits,
        metadata: request.metadata ? JSON.stringify(request.metadata) : null
    })

    if (entitlement.creditsBalance === -1) {
        return {
            deducted: false,
            credits: request.credits,
            creditsBalance: -1,
            entitlement: toEntitlementSnapshot(entitlement)
        }
    }

    const updateResult = await manager.decrement(
        Entitlement,
        { id: entitlement.id, creditsBalance: MoreThanOrEqual(request.credits) },
        'creditsBalance',
        request.credits
    )

    if (!updateResult.affected) {
        throw new InternalFlowiseError(StatusCodes.PAYMENT_REQUIRED, ENTITLEMENT_ERROR_MESSAGES.insufficientCredits)
    }

    const updatedEntitlement = (await manager.findOneBy(Entitlement, { id: entitlement.id })) ?? entitlement
    return {
        deducted: true,
        credits: request.credits,
        creditsBalance: updatedEntitlement.creditsBalance,
        entitlement: toEntitlementSnapshot(updatedEntitlement)
    }
}

const isUniqueConstraintError = (error: unknown): boolean => {
    const err = error as { code?: string | number; errno?: string | number; message?: string }
    const value = `${err?.code ?? ''} ${err?.errno ?? ''} ${err?.message ?? ''}`.toLowerCase()
    return value.includes('23505') || value.includes('1062') || value.includes('duplicate') || value.includes('unique')
}

export class EntitlementService {
    constructor(private readonly options: { dataSource?: DataSource; source?: EntitlementSource } = {}) {}

    async resolve(scopeId: string): Promise<EntitlementSnapshot> {
        const sourceSnapshot = await this.getSource().resolve(scopeId)
        if (isLicenseBackedSnapshot(sourceSnapshot)) {
            await this.getOrCreateEntitlement(scopeId, undefined, sourceSnapshot)
            return sourceSnapshot
        }

        const entitlement = await this.getOrCreateEntitlement(scopeId, undefined, sourceSnapshot)
        return toEntitlementSnapshot(entitlement)
    }

    async assertCreditsAvailable(scopeId: string, credits: number): Promise<EntitlementSnapshot> {
        const entitlement = await this.resolve(scopeId)
        if (credits <= 0 || entitlement.creditsBalance === -1) return entitlement
        if (entitlement.creditsBalance < credits) {
            throw new InternalFlowiseError(StatusCodes.PAYMENT_REQUIRED, ENTITLEMENT_ERROR_MESSAGES.insufficientCredits)
        }
        return entitlement
    }

    async checkLimit(scopeId: string, dimension: EntitlementLimitDimension, requested: number): Promise<EntitlementSnapshot> {
        const entitlement = await this.resolve(scopeId)
        const requestedUsage = normalizeRequestedUsage(requested)

        if (dimension === 'users') {
            assertEntitlementLimit(requestedUsage, entitlement.seats, ENTITLEMENT_ERROR_MESSAGES.seatLimitExceeded)
            return entitlement
        }

        if (dimension === 'flows') {
            assertEntitlementLimit(requestedUsage, entitlement.concurrency, ENTITLEMENT_ERROR_MESSAGES.flowLimitExceeded)
            return entitlement
        }

        if ((dimension === 'credits' || dimension === 'predictions') && requestedUsage > 0) {
            if (entitlement.creditsBalance !== -1 && entitlement.creditsBalance < requestedUsage) {
                throw new InternalFlowiseError(StatusCodes.PAYMENT_REQUIRED, ENTITLEMENT_ERROR_MESSAGES.insufficientCredits)
            }
        }

        return entitlement
    }

    async consumeCredits(request: CreditConsumptionRequest): Promise<CreditConsumptionResult> {
        const dataSource = this.getDataSource()

        try {
            return await dataSource.transaction(async (manager) => {
                const entitlement = await this.getOrCreateEntitlement(request.scopeId, manager)
                return consumeCreditsForEntitlement(manager, entitlement, request)
            })
        } catch (error) {
            if (!isUniqueConstraintError(error)) throw error

            const usage = await dataSource.getRepository(EntitlementUsage).findOne({
                where: {
                    scopeId: request.scopeId,
                    idempotencyKey: request.idempotencyKey
                }
            })
            if (!usage) throw error

            const entitlement =
                (await dataSource.getRepository(Entitlement).findOneBy({ id: usage.entitlementId })) ??
                (await this.getOrCreateEntitlement(request.scopeId))
            return {
                deducted: false,
                credits: usage.credits,
                creditsBalance: entitlement.creditsBalance,
                entitlement: toEntitlementSnapshot(entitlement)
            }
        }
    }

    async hasFeature(scopeId: string, feature: string): Promise<boolean> {
        const entitlement = await this.resolve(scopeId)
        return entitlement.features.includes(feature)
    }

    async getBillingCenterOverview(
        scopeId: string,
        options: EntitlementBillingCenterOverviewOptions = {}
    ): Promise<EntitlementBillingCenterOverview> {
        const sourceSnapshot = await this.resolve(scopeId)
        const persisted = await this.getDataSource().getRepository(Entitlement).findOneBy({ scopeId })
        const entitlement = mergeSourceMetadata(persisted ? toEntitlementSnapshot(persisted) : sourceSnapshot, sourceSnapshot)
        const now = options.now ?? new Date()
        const period = getEntitlementUsagePeriod(now)
        const [periodStart, periodEnd] = getEntitlementUsagePeriodRange(now)
        const usageRows = await this.getDataSource()
            .getRepository(EntitlementUsage)
            .find({
                where: {
                    scopeId,
                    createdDate: Between(periodStart, periodEnd)
                }
            })
        const byAction = summarizeEntitlementUsage(usageRows)

        return {
            edition: getFlowOpsEdition(options.env as NodeJS.ProcessEnv | undefined),
            period,
            entitlement,
            plans: getEntitlementPlanCatalog(),
            resourceUsage: {
                period,
                totalCredits: byAction.reduce((sum, item) => sum + item.credits, 0),
                byAction
            }
        }
    }

    private getDataSource(): DataSource {
        return this.options.dataSource ?? getRunningExpressApp().AppDataSource
    }

    private getSource(): EntitlementSource {
        return this.options.source ?? createEntitlementSource()
    }

    private async getOrCreateEntitlement(
        scopeId: string,
        manager?: EntityManager,
        resolvedSource?: EntitlementSnapshot
    ): Promise<Entitlement> {
        const sourceSnapshot = resolvedSource ?? (await this.getSource().resolve(scopeId))
        const existing = manager
            ? await manager.findOneBy(Entitlement, { scopeId })
            : await this.getDataSource().getRepository(Entitlement).findOneBy({ scopeId })
        if (existing) {
            if (!isLicenseBackedSnapshot(sourceSnapshot) && !shouldRefreshSubscriptionEntitlement(existing, sourceSnapshot)) return existing

            const updatedEntitlement = {
                ...existing,
                ...snapshotToEntity(sourceSnapshot)
            }
            return manager
                ? manager.save(Entitlement, updatedEntitlement)
                : this.getDataSource().getRepository(Entitlement).save(updatedEntitlement)
        }

        if (manager) {
            const entitlement = manager.create(Entitlement, snapshotToEntity(sourceSnapshot))
            return manager.save(Entitlement, entitlement)
        }

        const repository = this.getDataSource().getRepository(Entitlement)
        const entitlement = repository.create(snapshotToEntity(sourceSnapshot))
        return repository.save(entitlement)
    }
}

const normalizeRequestedUsage = (requested: number): number => {
    const value = Number(requested)
    return Number.isFinite(value) && value > 0 ? value : 0
}

const assertEntitlementLimit = (requested: number, limit: number, message: string): void => {
    if (limit === -1 || requested <= limit) return
    throw new InternalFlowiseError(StatusCodes.PAYMENT_REQUIRED, message)
}

const mergeSourceMetadata = (persisted: EntitlementSnapshot, source: EntitlementSnapshot): EntitlementSnapshot => ({
    ...persisted,
    readOnly: source.readOnly,
    licenseId: source.licenseId,
    licenseCustomer: source.licenseCustomer,
    licenseStatus: source.licenseStatus
})

const getEntitlementUsagePeriod = (date: Date = new Date()): string => {
    const year = date.getUTCFullYear()
    const month = `${date.getUTCMonth() + 1}`.padStart(2, '0')
    return `${year}-${month}`
}

const getEntitlementUsagePeriodRange = (date: Date): [Date, Date] => {
    const start = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), 1, 0, 0, 0, 0))
    const end = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth() + 1, 1, 0, 0, 0, 0))
    return [start, end]
}

const summarizeEntitlementUsage = (rows: EntitlementUsage[]): EntitlementUsageSummaryItem[] => {
    const totals = new Map<string, number>()
    for (const row of rows) {
        const action = row.action || 'other'
        totals.set(action, (totals.get(action) ?? 0) + Number(row.credits || 0))
    }
    return Array.from(totals.entries())
        .map(([action, credits]) => ({ action, credits }))
        .sort((left, right) => right.credits - left.credits)
}

export default new EntitlementService()
