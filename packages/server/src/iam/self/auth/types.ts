export type FlowOpsLoggedInUser = {
    id: string
    email: string
    name?: string | null
    status?: string
    role?: string
    isSSO: boolean
    activeOrganizationId?: string
    activeOrganizationSubscriptionId?: string | null
    activeOrganizationCustomerId?: string | null
    activeOrganizationProductId?: string | null
    activeWorkspaceId?: string
    activeWorkspace?: string
    lastLogin?: Date | null
    isOrganizationAdmin: boolean
    assignedWorkspaces: Array<{
        id: string
        name: string
        roleId: string
        role: string
        organizationId: string
    }>
    permissions: string[]
    features: Record<string, boolean>
    token?: string
}

export class FlowOpsAuthError extends Error {
    statusCode: number

    constructor(statusCode: number, message: string) {
        super(message)
        this.statusCode = statusCode
    }
}
