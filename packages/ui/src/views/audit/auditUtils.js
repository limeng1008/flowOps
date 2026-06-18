export const AUDIT_ACTION_GROUPS = [
    {
        labelKey: 'pages.audit.actionGroups.authentication',
        actions: [
            { value: 'auth.*' },
            { value: 'auth.register' },
            { value: 'auth.login' },
            { value: 'auth.loginFailed' },
            { value: 'auth.logout' },
            { value: 'auth.passwordReset' },
            { value: 'user.invite' }
        ]
    },
    {
        labelKey: 'pages.audit.actionGroups.roles',
        actions: [{ value: 'role.*' }, { value: 'role.create' }, { value: 'role.update' }, { value: 'role.delete' }]
    },
    {
        labelKey: 'pages.audit.actionGroups.workspaces',
        actions: [{ value: 'workspace.*' }, { value: 'workspace.create' }, { value: 'workspace.update' }, { value: 'workspace.delete' }]
    },
    {
        labelKey: 'pages.audit.actionGroups.workspaceUsers',
        actions: [
            { value: 'workspaceUser.*' },
            { value: 'workspaceUser.add' },
            { value: 'workspaceUser.roleChange' },
            { value: 'workspaceUser.delete' }
        ]
    },
    {
        labelKey: 'pages.audit.actionGroups.organizationUsers',
        actions: [{ value: 'organizationUser.*' }, { value: 'organizationUser.update' }, { value: 'organizationUser.delete' }]
    }
]

export const AUDIT_TARGET_TYPES = ['user', 'role', 'workspace', 'workspaceUser', 'organizationUser']
const AUDIT_FILTER_KEYS = ['actorUserId', 'action', 'targetType', 'workspaceId']

export const createAuditFilters = (action = '') => ({
    actorUserId: '',
    action,
    targetType: '',
    workspaceId: '',
    dateFrom: '',
    dateTo: ''
})

const normalizeDate = (value) => {
    if (!value) return undefined
    const date = new Date(value)
    return Number.isNaN(date.getTime()) ? undefined : date.toISOString()
}

export const buildAuditParams = (filters, pageNo, pageSize) => {
    const params = {}
    AUDIT_FILTER_KEYS.forEach((key) => {
        const value = filters[key]?.trim()
        if (value) params[key] = value
    })

    const dateFrom = normalizeDate(filters.dateFrom)
    const dateTo = normalizeDate(filters.dateTo)
    if (dateFrom) params.dateFrom = dateFrom
    if (dateTo) params.dateTo = dateTo
    if (pageNo !== undefined) params.pageNo = pageNo
    if (pageSize !== undefined) params.pageSize = pageSize
    return params
}

export const normalizeAuditMetadata = (metadata) => {
    if (!metadata) return {}
    if (typeof metadata === 'object' && !Array.isArray(metadata)) return metadata
    if (typeof metadata !== 'string') return {}
    try {
        const parsed = JSON.parse(metadata)
        return parsed && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
    } catch {
        return {}
    }
}
