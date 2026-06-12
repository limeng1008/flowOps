import { Application, NextFunction, Request, Response } from 'express'
import { Platform } from '../Interface'
import type { IdentityManager } from '../IdentityManager'
import { isSelfIamMode } from './provider'
import { FlowOpsIdentity } from './self/identity'

export type { IdentityManager } from '../IdentityManager'

export type FlowOpsIdentityFeatureMap = Record<string, string>
export type FlowOpsIdentityPermission = { key: string; value: string }
export type FlowOpsPermissionMap = Record<string, FlowOpsIdentityPermission[]>
export type FlowOpsPermissionGroup = { toJSON(): FlowOpsIdentityPermission[] }
export type FlowOpsPermissionsContainer = Record<string, FlowOpsPermissionGroup> & { toJSON(): FlowOpsPermissionMap }

export interface IFlowOpsIdentity {
    // P3: remove this compatibility pad when the enterprise boundary is physically stripped.
    [key: string]: any
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
}

type FlowOpsFeatureGateMiddleware = (req: Request, res: Response, next: NextFunction) => void

interface IFlowOpsIdentityConstructor {
    getInstance(): Promise<IFlowOpsIdentity>
    checkFeatureByPlan(feature: string): FlowOpsFeatureGateMiddleware
}

type EnterpriseIdentityModule = { IdentityManager: IFlowOpsIdentityConstructor }

const getBridgedEnterpriseIdentityManager = (): IFlowOpsIdentityConstructor => {
    const enterpriseIdentityModule = require('../IdentityManager') as unknown as EnterpriseIdentityModule
    // 接缝类型擦除: enterprise 符号只在运行时调用,不参与 iam/ 对外类型推导。
    return enterpriseIdentityModule.IdentityManager
}

export const getIdentityManager = async (): Promise<IFlowOpsIdentity> => {
    if (isSelfIamMode()) return await FlowOpsIdentity.getInstance()
    return await getBridgedEnterpriseIdentityManager().getInstance()
}

// 接缝类型擦除·App 槽位: legacy App.identityManager keeps the historical IdentityManager view until P3.
export const getIdentityManagerForApp = async (): Promise<IdentityManager> => (await getIdentityManager()) as unknown as IdentityManager

// 接缝类型擦除·视图转换: legacy App.identityManager enters self-owned IAM contexts through this bridge only.
export const toFlowOpsIdentityView = (im: IdentityManager): IFlowOpsIdentity => im as unknown as IFlowOpsIdentity

export const checkFeatureByPlan = (feature: string): FlowOpsFeatureGateMiddleware => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (isSelfIamMode()) return next()
        return getBridgedEnterpriseIdentityManager().checkFeatureByPlan(feature)(req, res, next)
    }
}
