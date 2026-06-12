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

export const getSelfEnterpriseFeatures = (): FlowOpsFeatureMap =>
    SELF_ENTERPRISE_FEATURE_FLAGS.reduce((features, feature) => {
        features[feature] = true
        return features
    }, {} as FlowOpsFeatureMap)
