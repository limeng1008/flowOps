jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn()
}))

import { StatusCodes } from 'http-status-codes'
import { Entitlement } from '../../database/entities/Entitlement'
import {
    ENTITLEMENT_ERROR_MESSAGES,
    ENTITLEMENT_TEMPLATES,
    FLOWOPS_ENTITLEMENT_FEATURES,
    LocalEntitlementSource,
    SubscriptionEntitlementSource,
    consumeCreditsForEntitlement,
    createEntitlementSource,
    getFlowOpsEdition
} from '.'

describe('FlowOps entitlement sources', () => {
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

    it('uses the subscription source in cloud edition and resolves the free template stub', async () => {
        expect(getFlowOpsEdition({ FLOWOPS_EDITION: 'cloud' })).toBe('cloud')
        expect(createEntitlementSource({ FLOWOPS_EDITION: 'cloud' })).toBeInstanceOf(SubscriptionEntitlementSource)

        const cloudSource = new SubscriptionEntitlementSource()
        const entitlement = await cloudSource.resolve('org_cloud')

        expect(entitlement).toMatchObject({
            scopeId: 'org_cloud',
            tier: 'free',
            source: 'subscription',
            creditsTotal: 200,
            creditsBalance: 200
        })
    })

    it('defines the free, pro, team, and enterprise entitlement templates', () => {
        expect(ENTITLEMENT_TEMPLATES.free).toMatchObject({ seats: 1, creditsTotal: 200, concurrency: 1 })
        expect(ENTITLEMENT_TEMPLATES.pro).toMatchObject({ seats: 5, creditsTotal: 5000, concurrency: 3 })
        expect(ENTITLEMENT_TEMPLATES.team).toMatchObject({ seats: 20, creditsTotal: 30000, concurrency: 10 })
        expect(ENTITLEMENT_TEMPLATES.enterprise).toMatchObject({ seats: -1, creditsTotal: -1, concurrency: -1 })
        expect(ENTITLEMENT_TEMPLATES.team.features).toContain(FLOWOPS_ENTITLEMENT_FEATURES.multiWorkspace)
        expect(ENTITLEMENT_TEMPLATES.enterprise.features).toContain(FLOWOPS_ENTITLEMENT_FEATURES.ssoAuditLogs)
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
