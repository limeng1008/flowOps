export const FLOWOPS_WORKSPACE_ROLE_NAMES = ['owner', 'admin', 'member', 'viewer']

export const isFlowOpsWorkspaceRole = (role) => FLOWOPS_WORKSPACE_ROLE_NAMES.includes(role?.name)

export const getFlowOpsRoleLabel = (roleName, t) => t(`flowOps.roles.${roleName}.name`, { defaultValue: roleName })

export const getFlowOpsRoleDescription = (roleName, t, fallback = '') =>
    t(`flowOps.roles.${roleName}.description`, { defaultValue: fallback })

export const filterFlowOpsWorkspaceRoles = (roles = []) =>
    FLOWOPS_WORKSPACE_ROLE_NAMES.map((roleName) => roles.find((role) => role?.name === roleName)).filter(Boolean)

export const toFlowOpsRoleOption = (role, t) => ({
    id: role.id,
    name: role.name,
    label: getFlowOpsRoleLabel(role.name, t),
    description: getFlowOpsRoleDescription(role.name, t, role.description)
})
