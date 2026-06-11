import { describe, expect, it, beforeEach, jest } from '@jest/globals'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'

const repos = new Map<unknown, any>()
const mockDataSource = {
    getRepository: jest.fn((entity: unknown) => repos.get(entity))
}

jest.mock('../../utils/getRunningExpressApp', () => ({
    getRunningExpressApp: jest.fn(() => ({
        AppDataSource: mockDataSource
    }))
}))

import {
    BILLING_ERROR_CODES,
    BillingService,
    BillingUsageSource,
    DEFAULT_FREE_PLAN,
    assertBillingAdmin,
    extractTokenUsage,
    getBillingPeriod,
    mergeBillingQuotas
} from './index'
import { BillingPlan } from '../../database/entities/BillingPlan'
import { BillingSubscription } from '../../database/entities/BillingSubscription'
import { BillingUsage } from '../../database/entities/BillingUsage'
import { ChatFlow } from '../../database/entities/ChatFlow'
import { Assistant } from '../../database/entities/Assistant'
import { Workspace } from '../../iam/entities'
import { OrganizationUser } from '../../iam/entities'

const makeRepo = (overrides: Record<string, unknown> = {}) => ({
    find: jest.fn(),
    findOne: jest.fn(),
    findOneBy: jest.fn(),
    countBy: jest.fn(),
    create: jest.fn((value: unknown) => value),
    save: jest.fn(async (value: unknown) => value),
    ...overrides
})

describe('billing service', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        repos.clear()
        delete process.env.BILLING_ADMIN_EMAILS
    })

    it('merges plan quotas with operator overrides while preserving unlimited limits', () => {
        expect(
            mergeBillingQuotas(
                { tokens: 1000, bots: 3, seats: -1 },
                {
                    tokens: 2000,
                    seats: 8
                }
            )
        ).toEqual({ tokens: 2000, bots: 3, seats: 8 })
    })

    it('returns YYYY-MM billing periods using UTC month boundaries', () => {
        expect(getBillingPeriod(new Date('2026-06-30T23:59:59.000Z'))).toBe('2026-06')
        expect(getBillingPeriod(new Date('2026-07-01T00:00:00.000Z'))).toBe('2026-07')
    })

    it('extracts token usage from common usage metadata shapes', () => {
        expect(extractTokenUsage({ usageMetadata: { input_tokens: 11, output_tokens: 7, total_tokens: 18 } })).toEqual({
            inputTokens: 11,
            outputTokens: 7,
            totalTokens: 18
        })
        expect(extractTokenUsage({ usage_metadata: { prompt_tokens: 3, completion_tokens: 5, total_tokens: 8 } })).toEqual({
            inputTokens: 3,
            outputTokens: 5,
            totalTokens: 8
        })
    })

    it('falls back to the built-in free plan when an organization has no active local subscription', async () => {
        const billingSubscriptionRepo = makeRepo({ findOne: jest.fn(async () => null) })
        const billingUsageRepo = makeRepo({
            find: jest.fn(async () => [{ totalTokens: 100 }, { totalTokens: 50 }])
        })
        const workspaceRepo = makeRepo({ findBy: jest.fn(async () => [{ id: 'ws-1' }, { id: 'ws-2' }]) })
        const chatFlowRepo = makeRepo({ countBy: jest.fn(async () => 2) })
        const assistantRepo = makeRepo({ countBy: jest.fn(async () => 1) })
        const orgUserRepo = makeRepo({ countBy: jest.fn(async () => 2) })

        repos.set(BillingPlan, makeRepo())
        repos.set(BillingSubscription, billingSubscriptionRepo)
        repos.set(BillingUsage, billingUsageRepo)
        repos.set(Workspace, workspaceRepo)
        repos.set(ChatFlow, chatFlowRepo)
        repos.set(Assistant, assistantRepo)
        repos.set(OrganizationUser, orgUserRepo)

        const overview = await BillingService.getOrganizationOverview('org-1')

        expect(overview.plan.code).toBe(DEFAULT_FREE_PLAN.code)
        expect(overview.quotas).toEqual(DEFAULT_FREE_PLAN.quotas)
        expect(overview.usage).toEqual({ tokens: 150, bots: 3, seats: 2 })
        expect(overview.exceeded).toEqual({ tokens: false, bots: false, seats: false })
    })

    it('records token usage once for the same dedupe key', async () => {
        const billingUsageRepo = makeRepo({
            findOneBy: jest.fn(async () => null),
            create: jest.fn((value: Record<string, unknown>) => ({ id: 'usage-1', ...value })),
            save: jest.fn(async (value: unknown) => value)
        })
        repos.set(BillingUsage, billingUsageRepo)

        await BillingService.recordTokenUsage({
            organizationId: 'org-1',
            workspaceId: 'ws-1',
            chatflowId: 'flow-1',
            source: BillingUsageSource.PREDICTION,
            sourceId: 'msg-1',
            dedupeKey: 'prediction:msg-1',
            usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
            createdAt: new Date('2026-06-04T12:00:00Z')
        })

        expect(billingUsageRepo.save).toHaveBeenCalledWith(
            expect.objectContaining({
                organizationId: 'org-1',
                period: '2026-06',
                totalTokens: 30,
                dedupeKey: 'prediction:msg-1'
            })
        )
        ;(billingUsageRepo.findOneBy as jest.MockedFunction<() => Promise<unknown>>).mockResolvedValueOnce({ id: 'usage-1' })
        await BillingService.recordTokenUsage({
            organizationId: 'org-1',
            workspaceId: 'ws-1',
            chatflowId: 'flow-1',
            source: BillingUsageSource.PREDICTION,
            sourceId: 'msg-1',
            dedupeKey: 'prediction:msg-1',
            usage: { inputTokens: 10, outputTokens: 20, totalTokens: 30 },
            createdAt: new Date('2026-06-04T12:00:00Z')
        })

        expect(billingUsageRepo.save).toHaveBeenCalledTimes(1)
    })

    it('throws 402 with a stable billing code when token limits are exceeded', async () => {
        jest.spyOn(BillingService, 'getOrganizationOverview').mockResolvedValueOnce({
            organizationId: 'org-1',
            period: '2026-06',
            plan: DEFAULT_FREE_PLAN,
            subscription: null,
            quotas: { tokens: 100, bots: 5, seats: 5 },
            usage: { tokens: 100, bots: 1, seats: 1 },
            exceeded: { tokens: true, bots: false, seats: false }
        } as any)

        await expect(BillingService.assertTokenAllowance('org-1')).rejects.toMatchObject({
            statusCode: StatusCodes.PAYMENT_REQUIRED,
            message: BILLING_ERROR_CODES.TOKEN_LIMIT_EXCEEDED
        })
    })

    it('allows bot usage to reach the plan limit', async () => {
        jest.spyOn(BillingService, 'getOrganizationOverview').mockResolvedValueOnce({
            organizationId: 'org-1',
            period: '2026-06',
            plan: DEFAULT_FREE_PLAN,
            subscription: null,
            quotas: { tokens: 100, bots: 3, seats: 3 },
            usage: { tokens: 0, bots: 2, seats: 1 },
            exceeded: { tokens: false, bots: false, seats: false }
        } as any)

        await expect(BillingService.assertBotAllowance('org-1', 3)).resolves.toBeUndefined()
    })

    it('throws 402 with a stable billing code when bot usage would exceed the plan limit', async () => {
        jest.spyOn(BillingService, 'getOrganizationOverview').mockResolvedValueOnce({
            organizationId: 'org-1',
            period: '2026-06',
            plan: DEFAULT_FREE_PLAN,
            subscription: null,
            quotas: { tokens: 100, bots: 3, seats: 3 },
            usage: { tokens: 0, bots: 3, seats: 1 },
            exceeded: { tokens: false, bots: false, seats: false }
        } as any)

        await expect(BillingService.assertBotAllowance('org-1', 4)).rejects.toMatchObject({
            statusCode: StatusCodes.PAYMENT_REQUIRED,
            message: BILLING_ERROR_CODES.BOT_LIMIT_EXCEEDED
        })
    })

    it('allows only BILLING_ADMIN_EMAILS to use billing admin APIs', () => {
        process.env.BILLING_ADMIN_EMAILS = 'ops@example.com, finance@example.com'

        expect(() => assertBillingAdmin({ email: 'ops@example.com' } as Express.User)).not.toThrow()
        expect(() => assertBillingAdmin({ email: 'user@example.com' } as Express.User)).toThrow(InternalFlowiseError)
    })
})
