export const WORKSPACE_FEATURE_FLAG = 'feat:workspaces'

export const hasWorkspaceFeature = (features) => {
    if (!features || Array.isArray(features)) return false
    if (!Object.hasOwnProperty.call(features, WORKSPACE_FEATURE_FLAG)) return false
    return features[WORKSPACE_FEATURE_FLAG] === 'true' || features[WORKSPACE_FEATURE_FLAG] === true
}

export const shouldRequestWorkspaceSwitcherWorkspaces = ({ features, canReadWorkspaceDirectory }) =>
    hasWorkspaceFeature(features) && canReadWorkspaceDirectory

export const sortWorkspaceOptions = (assignedWorkspaces) => {
    return assignedWorkspaces
        ? [...assignedWorkspaces].sort((a, b) => {
              const isSpecialA = /^[^a-zA-Z0-9]/.test(a.name)
              const isSpecialB = /^[^a-zA-Z0-9]/.test(b.name)

              if (isSpecialA && !isSpecialB) return 1
              if (!isSpecialA && isSpecialB) return -1

              return a.name.localeCompare(b.name, undefined, {
                  numeric: true,
                  sensitivity: 'base'
              })
          })
        : []
}

export const getUserAssignedWorkspaceOptions = (user) => {
    const activeOrganizationId = user?.activeOrganizationId
    const assignedWorkspaces = Array.isArray(user?.assignedWorkspaces) ? user.assignedWorkspaces : []

    return sortWorkspaceOptions(
        assignedWorkspaces
            .filter((workspace) => !activeOrganizationId || !workspace.organizationId || workspace.organizationId === activeOrganizationId)
            .map((workspace) => ({
                id: workspace.id ?? workspace.workspaceId,
                name: workspace.name ?? workspace.workspace?.name
            }))
            .filter((workspace) => workspace.id && workspace.name)
    )
}
