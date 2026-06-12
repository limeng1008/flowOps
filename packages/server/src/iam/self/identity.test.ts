import { NextFunction, Request, Response } from 'express'
import { Platform } from '../../Interface'
import { SELF_ENTERPRISE_FEATURE_FLAGS } from './features'
import { FlowOpsIdentity } from './identity'

describe('FlowOpsIdentity', () => {
    it('reports an enterprise-compatible platform with valid self-managed licensing', async () => {
        const identity = await FlowOpsIdentity.getInstance()

        expect(identity.getPlatformType()).toBe(Platform.ENTERPRISE)
        expect(identity.isLicenseValid()).toBe(true)
        expect(identity.isCloud()).toBe(false)
        await expect(identity.initializeSSO({} as any)).resolves.toBeUndefined()
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

        await expect(identity.getProductIdFromSubscription('self-managed')).resolves.toBe('')
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
