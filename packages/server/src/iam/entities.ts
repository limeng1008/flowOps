/* eslint-disable no-redeclare -- IAM entity exports are available as both public types and runtime entity constructors. */
import {
    FlowOpsLoginActivity,
    FlowOpsOrganization,
    FlowOpsRole,
    FlowOpsUser,
    FlowOpsWorkspace,
    FlowOpsWorkspaceMember
} from './self/entities'

export enum ErrorMessage {
    INVALID_MISSING_TOKEN = 'Invalid or Missing token',
    TOKEN_EXPIRED = 'Token Expired',
    REFRESH_TOKEN_EXPIRED = 'Refresh Token Expired'
}

export type LoggedInWorkspace = {
    id: string
    name: string
    role: string
    roleId?: string
    organizationId: string
}

export type LoggedInUser = {
    id: string
    email: string
    name: string
    status?: string
    role?: string
    roleId: string
    isSSO?: boolean
    ssoProvider?: string
    ssoToken?: string
    ssoRefreshToken?: string
    activeOrganizationId: string
    activeOrganizationSubscriptionId: string
    activeOrganizationCustomerId: string
    activeOrganizationProductId: string
    isOrganizationAdmin: boolean
    activeWorkspaceId: string
    activeWorkspace: string
    assignedWorkspaces: LoggedInWorkspace[]
    permissions: string[]
    features?: Record<string, string>
    lastLogin?: Date | null
    token?: string
}

export type LoginActivity = FlowOpsLoginActivity
export type WorkspaceUsers = FlowOpsWorkspaceMember
export type Organization = FlowOpsOrganization & {
    subscriptionId?: string
    customerId?: string
    productId?: string
}
export type OrganizationUser = FlowOpsWorkspaceMember & {
    organizationId?: string
}
export type Role = FlowOpsRole
export type User = FlowOpsUser & {
    createdBy?: string
    updatedBy?: string
    role?: string
    roleId?: string
    loginMode?: string
    activeWorkspaceId?: string
    activeOrganizationId?: string
    isSSO?: boolean
    ssoProvider?: string
}
export type Workspace = FlowOpsWorkspace
export type WorkspaceUser = FlowOpsWorkspaceMember

type EntityConstructor<T> = new (...args: any[]) => T

export const LoginActivity: EntityConstructor<LoginActivity> = FlowOpsLoginActivity
export const WorkspaceUsers: EntityConstructor<WorkspaceUsers> = FlowOpsWorkspaceMember
export const Organization: EntityConstructor<Organization> = FlowOpsOrganization
export const OrganizationUser: EntityConstructor<OrganizationUser> = FlowOpsWorkspaceMember
export const Role: EntityConstructor<Role> = FlowOpsRole
export const User: EntityConstructor<User> = FlowOpsUser
export const Workspace: EntityConstructor<Workspace> = FlowOpsWorkspace
export const WorkspaceUser: EntityConstructor<WorkspaceUser> = FlowOpsWorkspaceMember
