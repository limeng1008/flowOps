import fs from 'fs'
import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { Platform } from '../../Interface'
import { SELF_ENTERPRISE_FEATURE_FLAGS } from './features'
import { FlowOpsIdentity } from './identity'

describe('FlowOpsIdentity', () => {
    it('reports an enterprise-compatible platform with valid self-managed licensing', async () => {
        const identity = await FlowOpsIdentity.getInstance()

        expect(identity.getPlatformType()).toBe(Platform.ENTERPRISE)
        expect(identity.isLicenseValid()).toBe(true)
        expect(identity.isCloud()).toBe(false)
        expect(identity.isOpenSource()).toBe(false)
        expect(identity.isEnterprise()).toBe(true)
        await expect(identity.initializeSSO({} as any)).resolves.toBeUndefined()
        await expect(identity.initializeSsoProvider({} as any, 'auth0', {})).resolves.toBeUndefined()
    })

    it('enables every enterprise feature flag for the self track', async () => {
        const identity = await FlowOpsIdentity.getInstance()
        const features = await identity.getFeaturesByPlan('self-managed')

        expect(Object.keys(features).sort()).toEqual([...SELF_ENTERPRISE_FEATURE_FLAGS].sort())
        for (const feature of SELF_ENTERPRISE_FEATURE_FLAGS) {
            expect(features[feature]).toBe('true')
        }
    })

    it('keeps platform call sites satisfied without external product metadata', async () => {
        const identity = await FlowOpsIdentity.getInstance()

        await expect(identity.getProductIdFromSubscription('self-managed')).resolves.toBe('flowops-private')
    })

    it('serves permissions from the self RBAC catalog', async () => {
        const identity = await FlowOpsIdentity.getInstance()

        expect(identity.permissions.toJSON()).toEqual(identity.getPermissions().toJSON())
        expect(identity.getPermissionsByType('workspace')).toEqual(identity.permissions.workspace.toJSON())
        expect(identity.getPermissionsByType()).toEqual(expect.arrayContaining([{ key: 'workspace:create', value: 'workspace:create' }]))
    })

    it('fails cloud billing APIs explicitly in the private self track', async () => {
        const identity = await FlowOpsIdentity.getInstance()
        const calls: Array<() => Promise<unknown>> = [
            () => identity.createStripeUserAndSubscribe({ email: 'owner@example.com', userPlan: 'FREE', referral: '' }),
            () => identity.cancelSubscription('sub_1'),
            () => identity.updateSubscriptionPlan({} as Request, 'sub_1', 'prod_1', 123),
            () => identity.updateAdditionalSeats('sub_1', 2, 123),
            () => identity.updateStripeCustomerEmail('cus_1', 'owner@example.com'),
            () => identity.getAdditionalSeatsQuantity('sub_1'),
            () => identity.getAdditionalSeatsProration('sub_1', 2),
            () => identity.getPlanProration('sub_1', 'prod_1'),
            () => identity.getCustomerWithDefaultSource('cus_1'),
            () => identity.createStripeCustomerPortalSession({} as Request)
        ]

        for (const call of calls) {
            await expect(call()).rejects.toMatchObject({
                statusCode: StatusCodes.NOT_IMPLEMENTED,
                message: 'FlowOps 私有版不提供云计费'
            } satisfies Partial<InternalFlowiseError>)
        }
    })

    it('fails SSO refresh explicitly in the private self track', async () => {
        const identity = await FlowOpsIdentity.getInstance()

        await expect(identity.getRefreshToken('auth0', 'refresh-token')).rejects.toMatchObject({
            statusCode: StatusCodes.NOT_IMPLEMENTED,
            message: 'FlowOps 私有版不提供 SSO 刷新'
        } satisfies Partial<InternalFlowiseError>)
    })

    it('keeps the IAM identity seam strict and removes App-slot erasure bridges', () => {
        const iamIdentitySource = fs.readFileSync(path.join(__dirname, '../identity.ts'), 'utf8')
        const appSource = fs.readFileSync(path.join(__dirname, '../../index.ts'), 'utf8')
        const scheduleBeatSource = fs.readFileSync(path.join(__dirname, '../../schedule/ScheduleBeat.ts'), 'utf8')

        expect(iamIdentitySource).not.toContain('[key: string]: any')
        expect(iamIdentitySource).not.toContain('as unknown as')
        expect(iamIdentitySource).not.toContain('getIdentityManagerForApp')
        expect(iamIdentitySource).not.toContain('toFlowOpsIdentityView')
        expect(appSource).toContain('identityManager: IFlowOpsIdentity')
        expect(appSource).toContain("import { getFlowOpsIdentity, type IFlowOpsIdentity } from './iam/identity'")
        expect(appSource).not.toContain("from './IdentityManager'")
        expect(appSource).not.toContain('getIdentityManagerForApp')
        expect(appSource).not.toContain('toFlowOpsIdentityView')
        expect(scheduleBeatSource).not.toContain('toFlowOpsIdentityView')
    })

    it('allows feature-gated routers to proceed in self mode', () => {
        const next = jest.fn()
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any as Response

        FlowOpsIdentity.checkFeatureByPlan('feat:roles')({} as Request, res, next as NextFunction)

        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })
})
