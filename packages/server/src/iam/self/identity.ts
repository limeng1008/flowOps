import { Application, NextFunction, Request, Response } from 'express'
import { StatusCodes } from 'http-status-codes'
import { Platform } from '../../Interface'
import { InternalFlowiseError } from '../../errors/internalFlowiseError'
import { getFlowOpsEdition } from '../../services/edition'
import { getLicenseState } from '../../services/license/state'
import { SELF_ENTERPRISE_FEATURE_FLAGS } from './features'
import type {
    FlowOpsAdditionalSeatsQuantity,
    FlowOpsIdentityPermission,
    FlowOpsPermissionsContainer,
    FlowOpsStripeRegistration,
    FlowOpsStripeSubscription,
    IFlowOpsIdentity
} from '../identity'
import { ALL_SELF_PERMISSIONS, SELF_PERMISSION_GROUPS } from './rbac/permissions'

const FLOWOPS_PRIVATE_PRODUCT_ID = 'flowops-private'
const PRIVATE_CLOUD_BILLING_UNAVAILABLE = 'FlowOps 私有版不提供云计费'
const PRIVATE_SSO_REFRESH_UNAVAILABLE = 'FlowOps 私有版不提供 SSO 刷新'

const throwPrivateCloudBillingUnavailable = (): never => {
    throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, PRIVATE_CLOUD_BILLING_UNAVAILABLE)
}

export class FlowOpsIdentity implements IFlowOpsIdentity {
    private static instance: FlowOpsIdentity
    private readonly permissionMap: Record<string, FlowOpsIdentityPermission[]> = Object.fromEntries(
        Object.entries(SELF_PERMISSION_GROUPS).map(([group, permissions]) => [
            group,
            permissions.map((permission) => ({ key: permission.key, value: permission.value }))
        ])
    )
    permissions: FlowOpsPermissionsContainer = Object.assign(
        Object.fromEntries(Object.entries(this.permissionMap).map(([group, permissions]) => [group, { toJSON: () => permissions }])),
        {
            toJSON: () => this.permissionMap
        }
    )

    static async getInstance(): Promise<FlowOpsIdentity> {
        if (!FlowOpsIdentity.instance) FlowOpsIdentity.instance = new FlowOpsIdentity()
        return FlowOpsIdentity.instance
    }

    static checkFeatureByPlan(_feature: string) {
        return (_req: Request, _res: Response, next: NextFunction) => next()
    }

    getPlatformType(): Platform {
        return Platform.ENTERPRISE
    }

    isLicenseValid(): boolean {
        if (getFlowOpsEdition() === 'cloud') return true

        const licenseState = getLicenseState()
        if (licenseState.status === 'missing') return true
        return licenseState.status === 'active' || licenseState.status === 'grace'
    }

    isCloud(): boolean {
        return false
    }

    isOpenSource(): boolean {
        return false
    }

    isEnterprise(): boolean {
        return true
    }

    async getFeaturesByPlan(_subscriptionId?: string): Promise<Record<string, string>> {
        return SELF_ENTERPRISE_FEATURE_FLAGS.reduce((features, feature) => {
            features[feature] = 'true'
            return features
        }, {} as Record<string, string>)
    }

    async getProductIdFromSubscription(_subscriptionId?: string): Promise<string> {
        return FLOWOPS_PRIVATE_PRODUCT_ID
    }

    getPermissionsByType(type?: string): FlowOpsIdentityPermission[] {
        if (type && this.permissionMap[type]) return this.permissionMap[type]
        return ALL_SELF_PERMISSIONS.map((permission) => ({ key: permission, value: permission }))
    }

    getPermissions() {
        return this.permissions
    }

    async initializeSSO(_app?: Application): Promise<void> {
        return undefined
    }

    async initializeSsoProvider(_app: Application, _providerName: string, _config: Record<string, unknown>): Promise<void> {
        return undefined
    }

    async createStripeUserAndSubscribe(_data: FlowOpsStripeRegistration): Promise<FlowOpsStripeSubscription> {
        return throwPrivateCloudBillingUnavailable()
    }

    async cancelSubscription(_subscriptionId: string): Promise<unknown> {
        return throwPrivateCloudBillingUnavailable()
    }

    async updateSubscriptionPlan(_req: Request, _subscriptionId: string, _newPlanId: string, _prorationDate: number): Promise<unknown> {
        return throwPrivateCloudBillingUnavailable()
    }

    async updateAdditionalSeats(_subscriptionId: string, _quantity: number, _prorationDate: number): Promise<unknown> {
        return throwPrivateCloudBillingUnavailable()
    }

    async updateStripeCustomerEmail(_customerId: string, _email: string): Promise<void> {
        return throwPrivateCloudBillingUnavailable()
    }

    async getAdditionalSeatsQuantity(_subscriptionId: string): Promise<FlowOpsAdditionalSeatsQuantity> {
        return throwPrivateCloudBillingUnavailable()
    }

    async getAdditionalSeatsProration(_subscriptionId: string, _quantity: number): Promise<unknown> {
        return throwPrivateCloudBillingUnavailable()
    }

    async getPlanProration(_subscriptionId: string, _newPlanId: string): Promise<unknown> {
        return throwPrivateCloudBillingUnavailable()
    }

    async getCustomerWithDefaultSource(_customerId: string): Promise<unknown> {
        return throwPrivateCloudBillingUnavailable()
    }

    async createStripeCustomerPortalSession(_req: Request): Promise<{ url: string }> {
        return throwPrivateCloudBillingUnavailable()
    }

    async getRefreshToken(_ssoProvider?: string, _refreshToken?: string): Promise<Record<string, unknown>> {
        throw new InternalFlowiseError(StatusCodes.NOT_IMPLEMENTED, PRIVATE_SSO_REFRESH_UNAVAILABLE)
    }
}
