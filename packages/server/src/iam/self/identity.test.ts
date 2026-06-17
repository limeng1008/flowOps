import fs from 'fs'
import path from 'path'
import { NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { Platform } from '../../Interface'
import { LicenseVerificationResult } from '../../services/license'
import { setLicenseState } from '../../services/license/state'
import { SELF_ENTERPRISE_FEATURE_FLAGS } from './features'
import { FlowOpsIdentity } from './identity'

const makeLicenseState = (
    status: LicenseVerificationResult['status'],
    overrides: Partial<LicenseVerificationResult> = {}
): LicenseVerificationResult => ({
    valid: status === 'active' || status === 'grace',
    status,
    readOnly: status === 'grace' || status === 'expired',
    features: [],
    machineFingerprint: [],
    currentFingerprint: 'fp-test',
    ...overrides
})

describe('FlowOpsIdentity', () => {
    const originalFlowOpsEdition = process.env.FLOWOPS_EDITION
    const originalEdition = process.env.EDITION

    beforeEach(() => {
        delete process.env.FLOWOPS_EDITION
        delete process.env.EDITION
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
    })

    afterAll(() => {
        if (originalFlowOpsEdition === undefined) delete process.env.FLOWOPS_EDITION
        else process.env.FLOWOPS_EDITION = originalFlowOpsEdition
        if (originalEdition === undefined) delete process.env.EDITION
        else process.env.EDITION = originalEdition
    })

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

    it.each([
        ['missing', true],
        ['active', true],
        ['grace', true],
        ['expired', false],
        ['invalid', false]
    ] as Array<[LicenseVerificationResult['status'], boolean]>)(
        'resolves private license status %s to isLicenseValid=%s',
        async (status, expected) => {
            setLicenseState(makeLicenseState(status))
            const identity = await FlowOpsIdentity.getInstance()

            expect(identity.isLicenseValid()).toBe(expected)
        }
    )

    it('keeps cloud edition license enforcement disabled', async () => {
        process.env.FLOWOPS_EDITION = 'cloud'
        setLicenseState(makeLicenseState('expired'))
        const identity = await FlowOpsIdentity.getInstance()

        expect(identity.isLicenseValid()).toBe(true)
    })

    it('returns feature flags for the active private license tier', async () => {
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        const identity = await FlowOpsIdentity.getInstance()
        const features = await identity.getFeaturesByPlan('self-managed')

        expect(Object.keys(features).sort()).toEqual([...SELF_ENTERPRISE_FEATURE_FLAGS].sort())
        expect(features['feat:datasets']).toBe('true')
        expect(features['feat:roles']).toBe('true')
        expect(features['feat:files']).toBe('false')
        expect(features['feat:sso-config']).toBe('false')
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

    it('blocks feature-gated routers when the free tier does not include the feature', () => {
        const next = jest.fn()
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any as Response

        FlowOpsIdentity.checkFeatureByPlan('feat:roles')({} as Request, res, next as NextFunction)

        expect(next).not.toHaveBeenCalled()
        expect(res.status).toHaveBeenCalledWith(StatusCodes.FORBIDDEN)
        expect(res.json).toHaveBeenCalledWith({ message: '该功能需专业版' })
    })

    it('allows feature-gated routers when the active tier includes the feature', () => {
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        const next = jest.fn()
        const res = {
            status: jest.fn().mockReturnThis(),
            json: jest.fn()
        } as any as Response

        FlowOpsIdentity.checkFeatureByPlan('feat:roles')({} as Request, res, next as NextFunction)

        expect(next).toHaveBeenCalledTimes(1)
        expect(res.status).not.toHaveBeenCalled()
    })

    it('keeps cloud mode feature gates open except self SSO config', () => {
        process.env.FLOWOPS_EDITION = 'cloud'
        setLicenseState(makeLicenseState('expired', { tier: 'free' }))
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
