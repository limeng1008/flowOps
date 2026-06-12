import { Application, NextFunction, Request, Response } from 'express'
import { Platform } from '../../Interface'
import { SELF_ENTERPRISE_FEATURE_FLAGS } from './features'
import type { FlowOpsIdentityPermission, FlowOpsPermissionsContainer, IFlowOpsIdentity } from '../identity'
import { ALL_SELF_PERMISSIONS, SELF_PERMISSION_GROUPS } from './rbac/permissions'

export class FlowOpsIdentity implements IFlowOpsIdentity {
    [key: string]: any

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
        return true
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
        return ''
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
}
