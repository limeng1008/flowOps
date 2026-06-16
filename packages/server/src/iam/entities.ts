/* eslint-disable no-redeclare -- IAM entity exports are available as both public types and runtime entity constructors. */
import { isSelfIamMode } from './provider'
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
type EnterpriseEntitiesModule = {
    LoginActivity: EntityConstructor<LoginActivity>
    WorkspaceUsers: EntityConstructor<WorkspaceUsers>
}
type EnterpriseOrganizationModule = { Organization: EntityConstructor<Organization> }
type EnterpriseOrganizationUserModule = { OrganizationUser: EntityConstructor<OrganizationUser> }
type EnterpriseRoleModule = { Role: EntityConstructor<Role> }
type EnterpriseUserModule = { User: EntityConstructor<User> }
type EnterpriseWorkspaceModule = { Workspace: EntityConstructor<Workspace> }
type EnterpriseWorkspaceUserModule = { WorkspaceUser: EntityConstructor<WorkspaceUser> }

const getEnterpriseEntities = (): EnterpriseEntitiesModule => {
    // Enterprise mode keeps the legacy entity set until Phase E removes the enterprise branch.
    return require('../enterprise/database/entities/EnterpriseEntities') as EnterpriseEntitiesModule
}

const getEnterpriseOrganization = (): EntityConstructor<Organization> => {
    return (require('../enterprise/database/entities/organization.entity') as EnterpriseOrganizationModule).Organization
}

const getEnterpriseOrganizationUser = (): EntityConstructor<OrganizationUser> => {
    return (require('../enterprise/database/entities/organization-user.entity') as EnterpriseOrganizationUserModule).OrganizationUser
}

const getEnterpriseRole = (): EntityConstructor<Role> => {
    return (require('../enterprise/database/entities/role.entity') as EnterpriseRoleModule).Role
}

const getEnterpriseUser = (): EntityConstructor<User> => {
    return (require('../enterprise/database/entities/user.entity') as EnterpriseUserModule).User
}

const getEnterpriseWorkspace = (): EntityConstructor<Workspace> => {
    return (require('../enterprise/database/entities/workspace.entity') as EnterpriseWorkspaceModule).Workspace
}

const getEnterpriseWorkspaceUser = (): EntityConstructor<WorkspaceUser> => {
    return (require('../enterprise/database/entities/workspace-user.entity') as EnterpriseWorkspaceUserModule).WorkspaceUser
}

const selectIamEntity = <T>(selfEntity: EntityConstructor<T>, enterpriseEntity: () => EntityConstructor<T>): EntityConstructor<T> =>
    isSelfIamMode() ? selfEntity : enterpriseEntity()

export const LoginActivity: EntityConstructor<LoginActivity> = selectIamEntity(
    FlowOpsLoginActivity,
    () => getEnterpriseEntities().LoginActivity
)
export const WorkspaceUsers: EntityConstructor<WorkspaceUsers> = selectIamEntity(
    FlowOpsWorkspaceMember,
    () => getEnterpriseEntities().WorkspaceUsers
)
export const Organization: EntityConstructor<Organization> = selectIamEntity(FlowOpsOrganization, getEnterpriseOrganization)
export const OrganizationUser: EntityConstructor<OrganizationUser> = selectIamEntity(FlowOpsWorkspaceMember, getEnterpriseOrganizationUser)
export const Role: EntityConstructor<Role> = selectIamEntity(FlowOpsRole, getEnterpriseRole)
export const User: EntityConstructor<User> = selectIamEntity(FlowOpsUser, getEnterpriseUser)
export const Workspace: EntityConstructor<Workspace> = selectIamEntity(FlowOpsWorkspace, getEnterpriseWorkspace)
export const WorkspaceUser: EntityConstructor<WorkspaceUser> = selectIamEntity(FlowOpsWorkspaceMember, getEnterpriseWorkspaceUser)
