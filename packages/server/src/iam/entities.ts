/* eslint-disable no-redeclare -- P3 seam exports each legacy entity as both a type and a lazy runtime value. */
import { isSelfIamMode } from './provider'

import type {
    LoginActivity as LoginActivityEntity,
    WorkspaceShared as WorkspaceSharedEntity,
    WorkspaceUsers as WorkspaceUsersEntity
} from '../enterprise/database/entities/EnterpriseEntities'
import type { LoginMethod as LoginMethodEntity } from '../enterprise/database/entities/login-method.entity'
import type { LoginSession as LoginSessionEntity } from '../enterprise/database/entities/login-session.entity'
import type { Organization as OrganizationEntity } from '../enterprise/database/entities/organization.entity'
import type { OrganizationUser as OrganizationUserEntity } from '../enterprise/database/entities/organization-user.entity'
import type { Role as RoleEntity } from '../enterprise/database/entities/role.entity'
import type { User as UserEntity } from '../enterprise/database/entities/user.entity'
import type { Workspace as WorkspaceEntity } from '../enterprise/database/entities/workspace.entity'
import type { WorkspaceUser as WorkspaceUserEntity } from '../enterprise/database/entities/workspace-user.entity'
export type { ErrorMessage, LoggedInUser } from '../enterprise/Interface.Enterprise'

export type LoginActivity = LoginActivityEntity
export type WorkspaceShared = WorkspaceSharedEntity
export type WorkspaceUsers = WorkspaceUsersEntity
export type LoginMethod = LoginMethodEntity
export type LoginSession = LoginSessionEntity
export type Organization = OrganizationEntity
export type OrganizationUser = OrganizationUserEntity
export type Role = RoleEntity
export type User = UserEntity
export type Workspace = WorkspaceEntity
export type WorkspaceUser = WorkspaceUserEntity

type EntityConstructor<T> = new (...args: any[]) => T

const loadEnterpriseValue = <T>(loader: () => T): T => {
    if (isSelfIamMode()) return undefined as T
    return loader()
}

export const LoginActivity: EntityConstructor<LoginActivityEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/EnterpriseEntities').LoginActivity
})

export const WorkspaceShared: EntityConstructor<WorkspaceSharedEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/EnterpriseEntities').WorkspaceShared
})

export const WorkspaceUsers: EntityConstructor<WorkspaceUsersEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/EnterpriseEntities').WorkspaceUsers
})

export const LoginMethod: EntityConstructor<LoginMethodEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/login-method.entity').LoginMethod
})

export const LoginSession: EntityConstructor<LoginSessionEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/login-session.entity').LoginSession
})

export const Organization: EntityConstructor<OrganizationEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/organization.entity').Organization
})

export const OrganizationUser: EntityConstructor<OrganizationUserEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/organization-user.entity').OrganizationUser
})

export const Role: EntityConstructor<RoleEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/role.entity').Role
})

export const User: EntityConstructor<UserEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/user.entity').User
})

export const Workspace: EntityConstructor<WorkspaceEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/workspace.entity').Workspace
})

export const WorkspaceUser: EntityConstructor<WorkspaceUserEntity> = loadEnterpriseValue(() => {
    // P3 惰化:self 轨不加载 enterprise。
    return require('../enterprise/database/entities/workspace-user.entity').WorkspaceUser
})
