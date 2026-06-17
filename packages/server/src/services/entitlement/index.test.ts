jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn()
}))

import { StatusCodes } from 'http-status-codes'
import { BillingPlan } from '../../database/entities/BillingPlan'
import { BillingSubscription, BillingSubscriptionStatus } from '../../database/entities/BillingSubscription'
import { Entitlement } from '../../database/entities/Entitlement'
import { EntitlementUsage } from '../../database/entities/EntitlementUsage'
import { getRunningExpressApp } from '../../utils/getRunningExpressApp'
import {
    ENTITLEMENT_ERROR_MESSAGES,
    ENTITLEMENT_TEMPLATES,
    FLOWOPS_ENTITLEMENT_FEATURES,
    EntitlementService,
    LicenseEntitlementSource,
    LocalEntitlementSource,
    SubscriptionEntitlementSource,
    consumeCreditsForEntitlement,
    createEntitlementSource,
    getFlowOpsEdition
} from '.'

const mockRunningAppDataSource = (repos: Map<unknown, any>) => {
    ;(getRunningExpressApp as jest.Mock).mockReturnValue({
        AppDataSource: {
            getRepository: jest.fn((entity) => repos.get(entity))
        }
    })
}

describe('FlowOps entitlement sources', () => {
    beforeEach(() => {
        jest.clearAllMocks()
    })

    it('defaults to private edition and maps local commercial deployments to enterprise entitlements', async () => {
        expect(getFlowOpsEdition({})).toBe('private')

        const localSource = new LocalEntitlementSource({ FLOWOPS_LOCAL_COMMERCIAL: 'true' })
        const entitlement = await localSource.resolve('org_local')

        expect(entitlement).toMatchObject({
            scopeId: 'org_local',
            tier: 'enterprise',
            source: 'local',
            creditsBalance: -1
        })
        expect(entitlement.features).toContain(FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense)
    })

    it('uses the subscription source in cloud edition and resolves free when no active subscription exists', async () => {
        expect(getFlowOpsEdition({ FLOWOPS_EDITION: 'cloud' })).toBe('cloud')
        expect(getFlowOpsEdition({ EDITION: 'cloud' })).toBe('cloud')
        expect(createEntitlementSource({ FLOWOPS_EDITION: 'cloud' })).toBeInstanceOf(SubscriptionEntitlementSource)

        const billingSubscriptionRepo = { findOne: jest.fn(async () => null) }
        const billingPlanRepo = { findOne: jest.fn() }
        mockRunningAppDataSource(
            new Map<unknown, any>([
                [BillingSubscription, billingSubscriptionRepo],
                [BillingPlan, billingPlanRepo]
            ])
        )

        const cloudSource = new SubscriptionEntitlementSource()
        const entitlement = await cloudSource.resolve('org_cloud')

        expect(entitlement).toMatchObject({
            scopeId: 'org_cloud',
            tier: 'free',
            source: 'subscription',
            creditsTotal: 200,
            creditsBalance: 200
        })
        expect(billingPlanRepo.findOne).not.toHaveBeenCalled()
    })

    it('derives a subscription entitlement from the active billing subscription plan tier and quotas', async () => {
        const billingSubscriptionRepo = {
            findOne: jest.fn(async () => ({
                id: 'sub-pro',
                organizationId: 'org_cloud_paid',
                planId: 'plan-pro',
                status: BillingSubscriptionStatus.ACTIVE
            }))
        }
        const billingPlanRepo = {
            findOne: jest.fn(async () => ({
                id: 'plan-pro',
                code: 'pro',
                name: 'Pro',
                entitlementTier: 'pro',
                quotas: JSON.stringify({
                    creditsTotal: 9000,
                    seats: 7,
                    concurrency: 4,
                    features: [FLOWOPS_ENTITLEMENT_FEATURES.basicWorkflow, FLOWOPS_ENTITLEMENT_FEATURES.apiAccess]
                }),
                monthlyPriceCents: 9900,
                currency: 'CNY',
                isActive: true
            }))
        }
        mockRunningAppDataSource(
            new Map<unknown, any>([
                [BillingSubscription, billingSubscriptionRepo],
                [BillingPlan, billingPlanRepo]
            ])
        )

        const entitlement = await new SubscriptionEntitlementSource().resolve('org_cloud_paid')

        expect(entitlement).toMatchObject({
            scopeId: 'org_cloud_paid',
            tier: 'pro',
            source: 'subscription',
            seats: 7,
            creditsTotal: 9000,
            creditsBalance: 9000,
            concurrency: 4,
            features: [FLOWOPS_ENTITLEMENT_FEATURES.basicWorkflow, FLOWOPS_ENTITLEMENT_FEATURES.apiAccess]
        })
        expect(billingSubscriptionRepo.findOne).toHaveBeenCalledWith(
            expect.objectContaining({
                where: { organizationId: 'org_cloud_paid', status: BillingSubscriptionStatus.ACTIVE },
                order: { updatedDate: 'DESC' }
            })
        )
        expect(billingPlanRepo.findOne).toHaveBeenCalledWith({ where: [{ id: 'plan-pro' }, { code: 'plan-pro' }] })
    })

    it('treats non-active subscription rows and missing plans as free subscription entitlements', async () => {
        const billingSubscriptionRepo = {
            findOne: jest.fn(async () => ({
                id: 'sub-canceled',
                organizationId: 'org_cloud_canceled',
                planId: 'plan-pro',
                status: BillingSubscriptionStatus.CANCELED
            }))
        }
        const billingPlanRepo = { findOne: jest.fn() }
        mockRunningAppDataSource(
            new Map<unknown, any>([
                [BillingSubscription, billingSubscriptionRepo],
                [BillingPlan, billingPlanRepo]
            ])
        )

        await expect(new SubscriptionEntitlementSource().resolve('org_cloud_canceled')).resolves.toMatchObject({
            scopeId: 'org_cloud_canceled',
            tier: 'free',
            source: 'subscription'
        })
        expect(billingPlanRepo.findOne).not.toHaveBeenCalled()
    })

    it('defines the free, pro, team, and enterprise entitlement templates', () => {
        expect(ENTITLEMENT_TEMPLATES.free).toMatchObject({ seats: 1, creditsTotal: 200, concurrency: 1 })
        expect(ENTITLEMENT_TEMPLATES.pro).toMatchObject({ seats: 5, creditsTotal: 5000, concurrency: 3 })
        expect(ENTITLEMENT_TEMPLATES.team).toMatchObject({ seats: 20, creditsTotal: 30000, concurrency: 10 })
        expect(ENTITLEMENT_TEMPLATES.enterprise).toMatchObject({ seats: -1, creditsTotal: -1, concurrency: -1 })
        expect(ENTITLEMENT_TEMPLATES.team.features).toContain(FLOWOPS_ENTITLEMENT_FEATURES.multiWorkspace)
        expect(ENTITLEMENT_TEMPLATES.enterprise.features).toContain(FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs)
    })

    it('maps entitlement tiers to IAM feature gate flags', () => {
        expect(ENTITLEMENT_TEMPLATES.free.features).not.toContain('feat:datasets')
        expect(ENTITLEMENT_TEMPLATES.pro.features).toEqual(
            expect.arrayContaining(['feat:datasets', 'feat:evaluations', 'feat:evaluators', 'feat:logs'])
        )
        expect(ENTITLEMENT_TEMPLATES.pro.features).not.toContain('feat:roles')
        expect(ENTITLEMENT_TEMPLATES.team.features).toEqual(
            expect.arrayContaining(['feat:users', 'feat:workspaces', 'feat:roles', 'feat:login-activity'])
        )
        expect(ENTITLEMENT_TEMPLATES.enterprise.features).toContain('feat:files')
        expect(ENTITLEMENT_TEMPLATES.enterprise.features).not.toContain('feat:sso-config')
    })

    it('maps an active private license to an entitlement before using the local commercial fallback', async () => {
        const licenseSource = {
            getActiveLicense: jest.fn().mockResolvedValue({
                valid: true,
                status: 'active',
                readOnly: false,
                tier: 'enterprise',
                customer: 'Acme Gov',
                licenseId: 'lic_test_001',
                seats: 50,
                concurrency: 8,
                expireAt: new Date('2026-07-01T00:00:00.000Z'),
                features: [FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense, FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs]
            })
        }

        const localSource = new LocalEntitlementSource({ FLOWOPS_LOCAL_COMMERCIAL: 'false' }, licenseSource as any)
        const entitlement = await localSource.resolve('org_license')

        expect(entitlement).toMatchObject({
            scopeId: 'org_license',
            tier: 'enterprise',
            source: 'local',
            seats: 50,
            concurrency: 8,
            creditsBalance: -1,
            readOnly: false,
            licenseId: 'lic_test_001'
        })
        expect(entitlement.features).toEqual([
            FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense,
            FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs
        ])
    })

    it('keeps an expired private license in read-only grace when resolving entitlement', async () => {
        const source = new LicenseEntitlementSource({
            getActiveLicense: jest.fn().mockResolvedValue({
                valid: true,
                status: 'grace',
                readOnly: true,
                tier: 'team',
                seats: 12,
                concurrency: 4,
                expireAt: new Date('2026-06-01T00:00:00.000Z'),
                features: [FLOWOPS_ENTITLEMENT_FEATURES.multiWorkspace]
            })
        } as any)

        await expect(source.resolve('org_grace')).resolves.toMatchObject({
            scopeId: 'org_grace',
            tier: 'team',
            seats: 12,
            concurrency: 4,
            source: 'local',
            readOnly: true,
            features: [FLOWOPS_ENTITLEMENT_FEATURES.multiWorkspace]
        })
    })

    it('maps an expired private license to a read-only entitlement instead of hard-disconnecting', async () => {
        const source = new LicenseEntitlementSource({
            getActiveLicense: jest.fn().mockResolvedValue({
                valid: false,
                status: 'expired',
                readOnly: true,
                reason: 'LICENSE_EXPIRED',
                tier: 'enterprise',
                customer: 'Acme Gov',
                licenseId: 'lic_test_expired',
                seats: 50,
                concurrency: 8,
                expireAt: new Date('2026-05-01T00:00:00.000Z'),
                payload: { creditsTotal: -1 },
                features: [FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense]
            })
        } as any)

        await expect(source.resolve('org_expired')).resolves.toMatchObject({
            scopeId: 'org_expired',
            tier: 'enterprise',
            source: 'local',
            readOnly: true,
            licenseStatus: 'expired',
            licenseId: 'lic_test_expired',
            features: [FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense]
        })
    })

    it('refreshes an existing free entitlement from an imported license source', async () => {
        const existing = {
            id: 'ent_1',
            scopeId: 'org_license',
            tier: 'free',
            seats: 1,
            creditsTotal: 200,
            creditsBalance: 200,
            features: JSON.stringify(ENTITLEMENT_TEMPLATES.free.features),
            concurrency: 1,
            expireAt: null,
            source: 'local'
        } as Entitlement
        const repository = {
            findOneBy: jest.fn().mockResolvedValue(existing),
            create: jest.fn((value) => value),
            save: jest.fn((value) => Promise.resolve({ ...existing, ...value }))
        }
        const source = {
            resolve: jest.fn().mockResolvedValue({
                scopeId: 'org_license',
                tier: 'enterprise',
                seats: 50,
                creditsTotal: -1,
                creditsBalance: -1,
                features: [FLOWOPS_ENTITLEMENT_FEATURES.privateOfflineLicense],
                concurrency: 8,
                expireAt: new Date('2026-07-01T00:00:00.000Z'),
                source: 'local',
                readOnly: false,
                licenseStatus: 'active',
                licenseId: 'lic_test_001'
            })
        }
        const service = new EntitlementService({
            dataSource: { getRepository: jest.fn().mockReturnValue(repository) } as any,
            source: source as any
        })

        const entitlement = await service.resolve('org_license')

        expect(entitlement).toMatchObject({
            tier: 'enterprise',
            creditsBalance: -1,
            readOnly: false,
            licenseStatus: 'active',
            licenseId: 'lic_test_001'
        })
        expect(repository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                tier: 'enterprise',
                creditsBalance: -1,
                source: 'local'
            })
        )
    })

    it('refreshes an existing free entitlement when the active cloud subscription upgrades the source tier', async () => {
        const existing = {
            id: 'ent_cloud_free',
            scopeId: 'org_cloud_upgrade',
            tier: 'free',
            seats: 1,
            creditsTotal: 200,
            creditsBalance: 200,
            features: JSON.stringify(ENTITLEMENT_TEMPLATES.free.features),
            concurrency: 1,
            expireAt: null,
            source: 'subscription'
        } as Entitlement
        const repository = {
            findOneBy: jest.fn().mockResolvedValue(existing),
            create: jest.fn((value) => value),
            save: jest.fn((value) => Promise.resolve({ ...existing, ...value }))
        }
        const service = new EntitlementService({
            dataSource: { getRepository: jest.fn().mockReturnValue(repository) } as any,
            source: {
                resolve: jest.fn().mockResolvedValue({
                    scopeId: 'org_cloud_upgrade',
                    tier: 'pro',
                    seats: 5,
                    creditsTotal: 5000,
                    creditsBalance: 5000,
                    features: ENTITLEMENT_TEMPLATES.pro.features,
                    concurrency: 3,
                    expireAt: null,
                    source: 'subscription'
                })
            } as any
        })

        const entitlement = await service.resolve('org_cloud_upgrade')

        expect(entitlement).toMatchObject({ tier: 'pro', creditsTotal: 5000, creditsBalance: 5000, concurrency: 3 })
        expect(repository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                tier: 'pro',
                creditsTotal: 5000,
                creditsBalance: 5000,
                source: 'subscription'
            })
        )
    })

    it('refreshes an existing paid cloud entitlement back to free when the subscription source has no active plan', async () => {
        const existing = {
            id: 'ent_cloud_pro',
            scopeId: 'org_cloud_cancel',
            tier: 'pro',
            seats: 5,
            creditsTotal: 5000,
            creditsBalance: 4200,
            features: JSON.stringify(ENTITLEMENT_TEMPLATES.pro.features),
            concurrency: 3,
            expireAt: null,
            source: 'subscription'
        } as Entitlement
        const repository = {
            findOneBy: jest.fn().mockResolvedValue(existing),
            create: jest.fn((value) => value),
            save: jest.fn((value) => Promise.resolve({ ...existing, ...value }))
        }
        const service = new EntitlementService({
            dataSource: { getRepository: jest.fn().mockReturnValue(repository) } as any,
            source: {
                resolve: jest.fn().mockResolvedValue({
                    scopeId: 'org_cloud_cancel',
                    tier: 'free',
                    seats: 1,
                    creditsTotal: 200,
                    creditsBalance: 200,
                    features: ENTITLEMENT_TEMPLATES.free.features,
                    concurrency: 1,
                    expireAt: null,
                    source: 'subscription'
                })
            } as any
        })

        const entitlement = await service.resolve('org_cloud_cancel')

        expect(entitlement).toMatchObject({ tier: 'free', creditsTotal: 200, creditsBalance: 200, concurrency: 1 })
        expect(repository.save).toHaveBeenCalledWith(
            expect.objectContaining({
                tier: 'free',
                creditsTotal: 200,
                creditsBalance: 200,
                source: 'subscription'
            })
        )
    })
})

describe('FlowOps entitlement billing center overview', () => {
    it('returns plan templates, persisted balance, monthly usage grouped by action, and deployment edition', async () => {
        const entitlement = {
            id: 'ent_overview_1',
            scopeId: 'org_overview',
            tier: 'pro',
            seats: 5,
            creditsTotal: 5000,
            creditsBalance: 4200,
            features: JSON.stringify(ENTITLEMENT_TEMPLATES.pro.features),
            concurrency: 3,
            expireAt: new Date('2026-07-01T00:00:00.000Z'),
            source: 'subscription'
        } as Entitlement
        const entitlementRepo = {
            findOneBy: jest.fn().mockResolvedValue(entitlement),
            create: jest.fn((value) => value),
            save: jest.fn((value) => Promise.resolve({ ...entitlement, ...value }))
        }
        const usageRepo = {
            find: jest.fn().mockResolvedValue([
                { action: 'prediction', credits: 7 },
                { action: 'retrieval', credits: 2 },
                { action: 'prediction', credits: 3 },
                { action: 'export', credits: 10 }
            ])
        }
        const dataSource = {
            getRepository: jest.fn((entity) => (entity === Entitlement ? entitlementRepo : usageRepo))
        }
        const service = new EntitlementService({
            dataSource: dataSource as any,
            source: {
                resolve: jest.fn().mockResolvedValue({
                    scopeId: 'org_overview',
                    tier: 'pro',
                    seats: 5,
                    creditsTotal: 5000,
                    creditsBalance: 5000,
                    features: ENTITLEMENT_TEMPLATES.pro.features,
                    concurrency: 3,
                    expireAt: new Date('2026-07-01T00:00:00.000Z'),
                    source: 'subscription'
                })
            } as any
        })

        const overview = await (service as any).getBillingCenterOverview('org_overview', {
            env: { EDITION: 'cloud' },
            now: new Date('2026-06-10T12:00:00.000Z')
        })

        expect(overview).toMatchObject({
            edition: 'cloud',
            period: '2026-06',
            entitlement: {
                scopeId: 'org_overview',
                tier: 'pro',
                creditsBalance: 4200,
                expireAt: new Date('2026-07-01T00:00:00.000Z')
            },
            resourceUsage: {
                totalCredits: 22
            }
        })
        expect(overview.plans.map((plan: any) => plan.tier)).toEqual(['free', 'pro', 'team', 'enterprise'])
        expect(overview.plans.find((plan: any) => plan.tier === 'team')).toMatchObject({
            seats: 20,
            spaces: 10,
            creditsTotal: 30000,
            concurrency: 10,
            privateDeployment: 'optional',
            sourceOptions: ['subscription', 'license']
        })
        expect(overview.resourceUsage.byAction).toEqual([
            { action: 'prediction', credits: 10 },
            { action: 'export', credits: 10 },
            { action: 'retrieval', credits: 2 }
        ])
        expect(usageRepo.find).toHaveBeenCalledWith(
            expect.objectContaining({
                where: expect.objectContaining({ scopeId: 'org_overview' })
            })
        )
        expect(dataSource.getRepository).toHaveBeenCalledWith(EntitlementUsage)
    })
})

describe('FlowOps entitlement credit consumption', () => {
    const entitlement = {
        id: 'ent_1',
        scopeId: 'org_1',
        tier: 'free',
        seats: 1,
        creditsTotal: 3,
        creditsBalance: 3,
        features: JSON.stringify(ENTITLEMENT_TEMPLATES.free.features),
        concurrency: 1,
        source: 'subscription'
    } as Entitlement

    it('inserts the idempotency record before the atomic conditional decrement', async () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue(null),
            insert: jest.fn().mockResolvedValue(undefined),
            decrement: jest.fn().mockResolvedValue({ affected: 1 }),
            findOneBy: jest.fn().mockResolvedValue({ ...entitlement, creditsBalance: 2 })
        } as any

        const result = await consumeCreditsForEntitlement(manager, entitlement, {
            scopeId: 'org_1',
            idempotencyKey: 'prediction:chat_1',
            action: 'prediction',
            credits: 1
        })

        expect(result).toMatchObject({ deducted: true, credits: 1, creditsBalance: 2 })
        expect(manager.insert.mock.invocationCallOrder[0]).toBeLessThan(manager.decrement.mock.invocationCallOrder[0])
        expect(manager.decrement).toHaveBeenCalledWith(
            Entitlement,
            { id: 'ent_1', creditsBalance: { type: 'moreThanOrEqual', value: 1 } },
            'creditsBalance',
            1
        )
    })

    it('does not deduct again when the same idempotency key was already recorded', async () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue({
                entitlementId: 'ent_1',
                scopeId: 'org_1',
                idempotencyKey: 'prediction:chat_1',
                action: 'prediction',
                credits: 1
            }),
            insert: jest.fn(),
            decrement: jest.fn(),
            findOneBy: jest.fn().mockResolvedValue({ ...entitlement, creditsBalance: 2 })
        } as any

        const result = await consumeCreditsForEntitlement(manager, entitlement, {
            scopeId: 'org_1',
            idempotencyKey: 'prediction:chat_1',
            action: 'prediction',
            credits: 1
        })

        expect(result).toMatchObject({ deducted: false, creditsBalance: 2 })
        expect(manager.decrement).not.toHaveBeenCalled()
        expect(manager.insert).not.toHaveBeenCalled()
    })

    it('blocks over-budget consumption with the Chinese resource-credit error', async () => {
        const manager = {
            findOne: jest.fn().mockResolvedValue(null),
            insert: jest.fn().mockResolvedValue(undefined),
            decrement: jest.fn().mockResolvedValue({ affected: 0 }),
            findOneBy: jest.fn()
        } as any

        await expect(
            consumeCreditsForEntitlement(manager, entitlement, {
                scopeId: 'org_1',
                idempotencyKey: 'prediction:chat_2',
                action: 'prediction',
                credits: 5
            })
        ).rejects.toMatchObject({
            statusCode: StatusCodes.PAYMENT_REQUIRED,
            message: ENTITLEMENT_ERROR_MESSAGES.insufficientCredits
        })
    })
})

describe('FlowOps entitlement limit checks', () => {
    const createService = (overrides: Partial<Entitlement> = {}) => {
        const entitlement = {
            id: 'ent_limit_1',
            scopeId: 'org_limit',
            tier: 'team',
            seats: 3,
            creditsTotal: 10,
            creditsBalance: 5,
            features: JSON.stringify(ENTITLEMENT_TEMPLATES.team.features),
            concurrency: 2,
            expireAt: null,
            source: 'local',
            ...overrides
        } as Entitlement
        const repository = {
            findOneBy: jest.fn().mockResolvedValue(entitlement),
            create: jest.fn((value) => value),
            save: jest.fn((value) => Promise.resolve({ ...entitlement, ...value }))
        }

        return new EntitlementService({
            dataSource: { getRepository: jest.fn().mockReturnValue(repository) } as any,
            source: {
                resolve: jest.fn().mockResolvedValue({
                    scopeId: 'org_limit',
                    tier: 'team',
                    seats: 3,
                    creditsTotal: 10,
                    creditsBalance: 10,
                    features: ENTITLEMENT_TEMPLATES.team.features,
                    concurrency: 2,
                    expireAt: null,
                    source: 'local'
                })
            } as any
        })
    }

    it('allows usage at the entitlement seat and flow limits', async () => {
        const service = createService()

        await expect(service.checkLimit('org_limit', 'users', 3)).resolves.toMatchObject({ seats: 3 })
        await expect(service.checkLimit('org_limit', 'flows', 2)).resolves.toMatchObject({ concurrency: 2 })
    })

    it('blocks usage above the entitlement limits with Chinese 402 errors', async () => {
        const service = createService()

        await expect(service.checkLimit('org_limit', 'users', 4)).rejects.toMatchObject({
            statusCode: StatusCodes.PAYMENT_REQUIRED,
            message: ENTITLEMENT_ERROR_MESSAGES.seatLimitExceeded
        })
        await expect(service.checkLimit('org_limit', 'flows', 3)).rejects.toMatchObject({
            statusCode: StatusCodes.PAYMENT_REQUIRED,
            message: ENTITLEMENT_ERROR_MESSAGES.flowLimitExceeded
        })
    })

    it('checks credit-style dimensions against creditsBalance', async () => {
        const service = createService()

        await expect(service.checkLimit('org_limit', 'credits', 5)).resolves.toMatchObject({ creditsBalance: 5 })
        await expect(service.checkLimit('org_limit', 'credits', 6)).rejects.toMatchObject({
            statusCode: StatusCodes.PAYMENT_REQUIRED,
            message: ENTITLEMENT_ERROR_MESSAGES.insufficientCredits
        })
    })
})
