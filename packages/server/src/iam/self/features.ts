import { getFlowOpsEdition } from '../../services/edition'
import { getLicenseState } from '../../services/license/state'
import {
    getIamFeaturesForEntitlementTier,
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

export const getLicensedSelfFeatureSet = (): Set<string> => new Set(getIamFeaturesForEntitlementTier(getSelfFeatureTier()))

export const isSelfFeatureAllowed = (feature: string): boolean => getLicensedSelfFeatureSet().has(feature)

export const getSelfEnterpriseFeatures = (): FlowOpsFeatureMap =>
    SELF_ENTERPRISE_FEATURE_FLAGS.reduce((features, feature) => {
        features[feature] = isSelfFeatureAllowed(feature)
        return features
    }, {} as FlowOpsFeatureMap)
