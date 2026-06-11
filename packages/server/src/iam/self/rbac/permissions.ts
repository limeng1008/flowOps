export type SelfPermissionDefinition = {
    key: string
    value: string
    isOpenSource: boolean
    isEnterprise: boolean
    isCloud: boolean
}

const definePermissions = (keys: string[]): SelfPermissionDefinition[] =>
    keys.map((key) => ({
        key,
        value: key,
        isOpenSource: true,
        isEnterprise: true,
        isCloud: true
    }))

export const SELF_PERMISSION_GROUPS = {
    agentflows: definePermissions([
        'agentflows:config',
        'agentflows:create',
        'agentflows:delete',
        'agentflows:domains',
        'agentflows:duplicate',
        'agentflows:export',
        'agentflows:import',
        'agentflows:update',
        'agentflows:view'
    ]),
    apikeys: definePermissions(['apikeys:create', 'apikeys:delete', 'apikeys:update', 'apikeys:view']),
    assistants: definePermissions(['assistants:create', 'assistants:delete', 'assistants:update', 'assistants:view']),
    chatflows: definePermissions([
        'chatflows:config',
        'chatflows:create',
        'chatflows:delete',
        'chatflows:domains',
        'chatflows:duplicate',
        'chatflows:export',
        'chatflows:import',
        'chatflows:update',
        'chatflows:view'
    ]),
    credentials: definePermissions([
        'credentials:create',
        'credentials:delete',
        'credentials:share',
        'credentials:update',
        'credentials:view'
    ]),
    datasets: definePermissions(['datasets:create', 'datasets:delete', 'datasets:update', 'datasets:view']),
    documentStores: definePermissions([
        'documentStores:add-loader',
        'documentStores:create',
        'documentStores:delete',
        'documentStores:delete-loader',
        'documentStores:preview-process',
        'documentStores:update',
        'documentStores:upsert-config',
        'documentStores:view'
    ]),
    evaluations: definePermissions(['evaluations:create', 'evaluations:delete', 'evaluations:run', 'evaluations:view']),
    evaluators: definePermissions(['evaluators:create', 'evaluators:delete', 'evaluators:update', 'evaluators:view']),
    executions: definePermissions(['executions:delete', 'executions:view']),
    loginActivity: definePermissions(['loginActivity:view']),
    logs: definePermissions(['logs:view']),
    roles: definePermissions(['roles:manage']),
    sso: definePermissions(['sso:manage']),
    templates: definePermissions([
        'templates:custom',
        'templates:custom-delete',
        'templates:custom-share',
        'templates:flowexport',
        'templates:marketplace',
        'templates:toolexport'
    ]),
    tools: definePermissions(['tools:create', 'tools:delete', 'tools:export', 'tools:update', 'tools:view']),
    users: definePermissions(['users:manage']),
    variables: definePermissions(['variables:create', 'variables:delete', 'variables:update', 'variables:view']),
    workspace: definePermissions([
        'workspace:add-user',
        'workspace:create',
        'workspace:delete',
        'workspace:export',
        'workspace:import',
        'workspace:unlink-user',
        'workspace:update',
        'workspace:view'
    ])
}

export const ALL_SELF_PERMISSIONS = Object.values(SELF_PERMISSION_GROUPS)
    .flat()
    .map((permission) => permission.key)

export const ADMIN_SELF_PERMISSIONS = ALL_SELF_PERMISSIONS.filter((permission) => !['sso:manage', 'logs:view'].includes(permission))

export const MEMBER_SELF_PERMISSIONS = [
    'agentflows:config',
    'agentflows:create',
    'agentflows:duplicate',
    'agentflows:export',
    'agentflows:import',
    'agentflows:update',
    'agentflows:view',
    'assistants:create',
    'assistants:update',
    'assistants:view',
    'chatflows:config',
    'chatflows:create',
    'chatflows:duplicate',
    'chatflows:export',
    'chatflows:import',
    'chatflows:update',
    'chatflows:view',
    'credentials:create',
    'credentials:update',
    'credentials:view',
    'datasets:create',
    'datasets:update',
    'datasets:view',
    'documentStores:add-loader',
    'documentStores:create',
    'documentStores:preview-process',
    'documentStores:update',
    'documentStores:upsert-config',
    'documentStores:view',
    'evaluations:create',
    'evaluations:run',
    'evaluations:view',
    'evaluators:create',
    'evaluators:update',
    'evaluators:view',
    'executions:view',
    'templates:custom',
    'templates:flowexport',
    'templates:marketplace',
    'templates:toolexport',
    'tools:create',
    'tools:export',
    'tools:update',
    'tools:view',
    'variables:create',
    'variables:update',
    'variables:view'
]

export const BUILTIN_SELF_ROLE_PERMISSIONS = {
    owner: ALL_SELF_PERMISSIONS,
    admin: ADMIN_SELF_PERMISSIONS,
    member: MEMBER_SELF_PERMISSIONS
}

export const parsePermissionJson = (permissions?: string | null): string[] => {
    if (!permissions) return []
    try {
        const parsed = JSON.parse(permissions)
        if (!Array.isArray(parsed)) return []
        if (parsed.includes('*')) return ALL_SELF_PERMISSIONS
        return parsed.filter((permission): permission is string => typeof permission === 'string')
    } catch {
        return []
    }
}

export const normalizePermissionJson = (permissions?: string | string[] | null): string => {
    const parsed = Array.isArray(permissions) ? permissions : parsePermissionJson(permissions)
    const allowed = new Set(ALL_SELF_PERMISSIONS)
    return JSON.stringify(parsed.filter((permission) => allowed.has(permission)))
}
