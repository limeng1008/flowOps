export type EntitlementTier = 'free' | 'pro' | 'team' | 'enterprise'

export interface EntitlementTemplate {
    tier: EntitlementTier
    seats: number
    creditsTotal: number
    creditsBalance: number
    features: string[]
    concurrency: number
}

export const ENTITLEMENT_TIERS: EntitlementTier[] = ['free', 'pro', 'team', 'enterprise']

export const isEntitlementTier = (value: unknown): value is EntitlementTier => {
    return ENTITLEMENT_TIERS.includes(`${value ?? ''}`.trim().toLowerCase() as EntitlementTier)
}

export const inferEntitlementTierFromPlanCode = (planCode?: string | null): EntitlementTier => {
    const code = `${planCode ?? ''}`.trim().toLowerCase()
    if (!code) return 'free'
    if (code.startsWith('local_dev') || code.includes('enterprise')) return 'enterprise'
    if (code.includes('team')) return 'team'
    if (code === 'pro' || code.includes('_pro') || code.includes('-pro')) return 'pro'
    if (code.includes('free')) return 'free'
    return 'free'
}

export const normalizeEntitlementTier = (value: unknown, fallbackPlanCode?: string | null): EntitlementTier => {
    const normalized = `${value ?? ''}`.trim().toLowerCase()
    return isEntitlementTier(normalized) ? normalized : inferEntitlementTierFromPlanCode(fallbackPlanCode)
}

export const isLocalCommercialEnabled = (env: NodeJS.ProcessEnv = process.env): boolean => {
    const value = env.FLOWOPS_LOCAL_COMMERCIAL?.trim().toLowerCase()
    return value === '1' || value === 'true' || value === 'yes' || value === 'on'
}

export const FLOWOPS_ENTITLEMENT_FEATURES = {
    basicWorkflow: 'basic-workflow',
    chinaModels: 'china-models',
    pptExcelExport: 'ppt-excel-export',
    contentSafety: 'content-safety',
    humanHandoff: 'human-handoff',
    traceDebugging: 'trace-debugging',
    chinaCloudVectorStores: 'china-cloud-vector-stores',
    multiWorkspace: 'multi-workspace',
    ssoAuditLogs: 'sso-audit-logs',
    privateOfflineLicense: 'private-offline-license',
    customBranding: 'custom-branding',
    apiAccess: 'api-access'
} as const

export const IAM_FEATURES_BY_TIER: Record<EntitlementTier, string[]> = {
    free: [],
    pro: ['feat:datasets', 'feat:evaluations', 'feat:evaluators', 'feat:logs'],
    team: [
        'feat:datasets',
        'feat:evaluations',
        'feat:evaluators',
        'feat:logs',
        'feat:users',
        'feat:workspaces',
        'feat:roles',
        'feat:login-activity'
    ],
    enterprise: [
        'feat:datasets',
        'feat:evaluations',
        'feat:evaluators',
        'feat:logs',
        'feat:users',
        'feat:workspaces',
        'feat:roles',
        'feat:login-activity',
        'feat:files'
    ]
}

const FREE_FEATURES = [
    FLOWOPS_ENTITLEMENT_FEATURES.basicWorkflow,
    FLOWOPS_ENTITLEMENT_FEATURES.chinaModels,
    FLOWOPS_ENTITLEMENT_FEATURES.apiAccess
]

const PRO_FEATURES = [
    ...FREE_FEATURES,
    FLOWOPS_ENTITLEMENT_FEATURES.pptExcelExport,
    FLOWOPS_ENTITLEMENT_FEATURES.contentSafety,
    FLOWOPS_ENTITLEMENT_FEATURES.traceDebugging,
    ...IAM_FEATURES_BY_TIER.pro
]

const TEAM_FEATURES = [
    ...PRO_FEATURES,
    FLOWOPS_ENTITLEMENT_FEATURES.humanHandoff,
    FLOWOPS_ENTITLEMENT_FEATURES.chinaCloudVectorStores,
    FLOWOPS_ENTITLEMENT_FEATURES.multiWorkspace,
    FLOWOPS_ENTITLEMENT_FEATURES.customBranding,
    ...IAM_FEATURES_BY_TIER.team.filter((feature) => !PRO_FEATURES.includes(feature))
]

const ENTITLEMENT_FEATURE_SET = new Set<string>(Object.values(FLOWOPS_ENTITLEMENT_FEATURES))

const ENTERPRISE_FEATURES = [
    ...Object.values(FLOWOPS_ENTITLEMENT_FEATURES),
    ...IAM_FEATURES_BY_TIER.enterprise.filter((feature) => !ENTITLEMENT_FEATURE_SET.has(feature))
]

export const ENTITLEMENT_TEMPLATES: Record<EntitlementTier, EntitlementTemplate> = {
    free: {
        tier: 'free',
        seats: 1,
        creditsTotal: 200,
        creditsBalance: 200,
        features: FREE_FEATURES,
        concurrency: 1
    },
    pro: {
        tier: 'pro',
        seats: 5,
        creditsTotal: 5000,
        creditsBalance: 5000,
        features: PRO_FEATURES,
        concurrency: 3
    },
    team: {
        tier: 'team',
        seats: 20,
        creditsTotal: 30000,
        creditsBalance: 30000,
        features: TEAM_FEATURES,
        concurrency: 10
    },
    enterprise: {
        tier: 'enterprise',
        seats: -1,
        creditsTotal: -1,
        creditsBalance: -1,
        features: ENTERPRISE_FEATURES,
        concurrency: -1
    }
}

export const getIamFeaturesForEntitlementTier = (tier: EntitlementTier): string[] => IAM_FEATURES_BY_TIER[tier] ?? []
