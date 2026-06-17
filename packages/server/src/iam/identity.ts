import { Application, NextFunction, Request, Response } from 'express'
import { Platform } from '../Interface'
import { FlowOpsIdentity } from './self/identity'

export type FlowOpsIdentityFeatureMap = Record<string, string>
export type FlowOpsIdentityPermission = { key: string; value: string }
export type FlowOpsPermissionMap = Record<string, FlowOpsIdentityPermission[]>
export type FlowOpsPermissionGroup = { toJSON(): FlowOpsIdentityPermission[] }
export type FlowOpsPermissionsContainer = Record<string, FlowOpsPermissionGroup> & { toJSON(): FlowOpsPermissionMap }
export type FlowOpsStripeRegistration = { email: string; userPlan?: string; referral?: string }
export type FlowOpsStripeSubscription = { customerId: string; subscriptionId: string }
export type FlowOpsAdditionalSeatsQuantity = { quantity: number; includedSeats: number }

export interface IFlowOpsIdentity {
    permissions: FlowOpsPermissionsContainer
    getPlatformType(): Platform
    isLicenseValid(): boolean
    isCloud(): boolean
    isOpenSource(): boolean
    isEnterprise(): boolean
    getFeaturesByPlan(subscriptionId?: string): Promise<FlowOpsIdentityFeatureMap>
    getProductIdFromSubscription(subscriptionId?: string): Promise<string>
    getPermissions(): { toJSON(): FlowOpsPermissionMap }
    getPermissionsByType(type?: string): FlowOpsIdentityPermission[]
    initializeSSO(app?: Application): Promise<void> | void
    initializeSsoProvider(app: Application, providerName: string, config: Record<string, unknown>): Promise<void> | void
    createStripeUserAndSubscribe(data: FlowOpsStripeRegistration): Promise<FlowOpsStripeSubscription>
    cancelSubscription(subscriptionId: string): Promise<unknown>
    updateSubscriptionPlan(req: Request, subscriptionId: string, newPlanId: string, prorationDate: number): Promise<unknown>
    updateAdditionalSeats(subscriptionId: string, quantity: number, prorationDate: number): Promise<unknown>
    updateStripeCustomerEmail(customerId: string, email: string): Promise<void>
    getAdditionalSeatsQuantity(subscriptionId: string): Promise<FlowOpsAdditionalSeatsQuantity>
    getAdditionalSeatsProration(subscriptionId: string, quantity: number): Promise<unknown>
    getPlanProration(subscriptionId: string, newPlanId: string): Promise<unknown>
    getCustomerWithDefaultSource(customerId: string): Promise<unknown>
    createStripeCustomerPortalSession(req: Request): Promise<{ url: string }>
    getRefreshToken(ssoProvider?: string, refreshToken?: string): Promise<Record<string, unknown>>
}

type FlowOpsFeatureGateMiddleware = (req: Request, res: Response, next: NextFunction) => void

export const getFlowOpsIdentity = async (): Promise<IFlowOpsIdentity> => await FlowOpsIdentity.getInstance()

export const checkFeatureByPlan = (feature: string): FlowOpsFeatureGateMiddleware => {
    return (req: Request, res: Response, next: NextFunction) => FlowOpsIdentity.checkFeatureByPlan(feature)(req, res, next)
}
