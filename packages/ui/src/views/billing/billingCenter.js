const ACTION_ALIASES = {
    prediction: 'prediction',
    chat: 'prediction',
    retrieval: 'retrieval',
    vector_retrieval: 'retrieval',
    export: 'export',
    ppt_export: 'export',
    excel_export: 'export',
    workflow: 'workflow',
    embedding: 'embedding',
    document_embedding: 'embedding'
}

export const resolveFlowOpsEdition = (config = {}, overview = {}) => {
    const edition = `${overview?.edition || config?.FLOWOPS_EDITION || config?.EDITION || ''}`.trim().toLowerCase()
    return edition === 'cloud' ? 'cloud' : 'private'
}

export const isCloudBillingEdition = (config = {}, overview = {}) => resolveFlowOpsEdition(config, overview) === 'cloud'

export const getPrimaryBillingAction = (edition) => ({
    showOnlinePayment: edition === 'cloud',
    showLicenseEntry: edition !== 'cloud'
})

export const getEntitlementExpiryState = (entitlement, now = new Date()) => {
    if (!entitlement) return null
    if (entitlement.readOnly || entitlement.licenseStatus === 'grace') return 'grace'
    if (!entitlement.expireAt) return null

    const expireAt = new Date(entitlement.expireAt).getTime()
    if (!Number.isFinite(expireAt)) return null

    const daysRemaining = Math.ceil((expireAt - now.getTime()) / (24 * 60 * 60 * 1000))
    return daysRemaining >= 0 && daysRemaining <= 14 ? 'expiringSoon' : null
}

export const buildResourceUsageRows = (resourceUsage = {}, creditsTotal = 0) =>
    (resourceUsage.byAction || [])
        .map((item) => {
            const action = ACTION_ALIASES[item.action] || 'other'
            const credits = Number(item.credits || 0)
            const percent = creditsTotal > 0 ? Math.min((credits / creditsTotal) * 100, 100) : 0
            return {
                action,
                labelKey: `pages.billingCenter.usageActions.${action}`,
                credits,
                percent
            }
        })
        .sort((left, right) => right.credits - left.credits)
