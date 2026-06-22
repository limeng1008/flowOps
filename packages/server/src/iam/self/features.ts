import { getFlowOpsEdition } from '../../services/edition'
import { getLicenseState } from '../../services/license/state'
import {
    ALL_ENTITLEMENT_FEATURES,
    getEntitlementFeaturesForTier,
    isLocalCommercialEnabled,
    normalizeEntitlementTier,
    type EntitlementTier
} from '../../services/entitlement/catalog'

export type FlowOpsFeatureMap = Record<string, boolean>

export const SELF_ENTERPRISE_FEATURE_FLAGS = [
    'feat:datasets',
    'feat:evaluations',
    'feat:evaluators',
    'feat:files',
    'feat:login-activity',
    'feat:audit',
    'feat:users',
    'feat:workspaces',
    'feat:logs',
    'feat:roles',
    'feat:sso-config'
]

export const getSelfFeatureTier = (): EntitlementTier => {
    if (getFlowOpsEdition() === 'cloud') return 'enterprise'
    if (isLocalCommercialEnabled()) return 'enterprise'

    const licenseState = getLicenseState()
    if (licenseState.status === 'missing') return 'free'
    return normalizeEntitlementTier(licenseState.tier ?? licenseState.payload?.tier)
}

export const getLicensedSelfFeatureSet = (): Set<string> => new Set(getEntitlementFeaturesForTier(getSelfFeatureTier()))

export const isSelfFeatureAllowed = (feature: string): boolean => getLicensedSelfFeatureSet().has(feature)

// 透传给 UI 的完整功能位字典 = 所有档位功能并集 ∪ IAM 标志（保留 feat:sso-config 等恒 false 的位，UI 据此隐藏入口）
export const ALL_SELF_FEATURE_CODES: string[] = Array.from(new Set([...SELF_ENTERPRISE_FEATURE_FLAGS, ...ALL_ENTITLEMENT_FEATURES]))

export const getSelfEnterpriseFeatures = (): FlowOpsFeatureMap => {
    const licensed = getLicensedSelfFeatureSet()
    return ALL_SELF_FEATURE_CODES.reduce((features, feature) => {
        features[feature] = licensed.has(feature)
        return features
    }, {} as FlowOpsFeatureMap)
}
