import { StatusCodes } from 'http-status-codes'
import type { DataSource, EntityManager } from 'typeorm'
import { ENTITLEMENT_TEMPLATES } from '../../services/entitlement/catalog'
import { FlowOpsAuthError } from './auth/types'
import { FlowOpsOrganization, FlowOpsUser, FlowOpsWorkspace, FlowOpsWorkspaceMember } from './entities'
import { getSelfFeatureTier } from './features'

type RepositorySource = DataSource | EntityManager

export const SELF_SEAT_LIMIT_EXCEEDED_MESSAGE = '座位已满,需扩容授权'

export const getSelfSeatLimit = (): number => ENTITLEMENT_TEMPLATES[getSelfFeatureTier()].seats

export const getOrganizationUserIds = async (source: RepositorySource, organizationId: string): Promise<Set<string>> => {
    const userIds = new Set<string>()
    const organization = await source.getRepository(FlowOpsOrganization).findOneBy({ id: organizationId })
    if (organization?.ownerUserId) userIds.add(organization.ownerUserId)

    const workspaces = await source.getRepository(FlowOpsWorkspace).findBy({ organizationId })
    const memberRepo = source.getRepository(FlowOpsWorkspaceMember)
    for (const workspace of workspaces) {
        const members = await memberRepo.findBy({ workspaceId: workspace.id })
        for (const member of members) userIds.add(member.userId)
    }

    const existingUserIds = new Set<string>()
    const userRepo = source.getRepository(FlowOpsUser)
    for (const userId of userIds) {
        if (await userRepo.findOneBy({ id: userId })) existingUserIds.add(userId)
    }
    return existingUserIds
}

export const getOrganizationUserCount = async (source: RepositorySource, organizationId: string): Promise<number> =>
    (await getOrganizationUserIds(source, organizationId)).size

export const isOrganizationUser = async (source: RepositorySource, organizationId: string, userId: string): Promise<boolean> =>
    (await getOrganizationUserIds(source, organizationId)).has(userId)

export const assertSelfSeatLimit = async (source: RepositorySource, organizationId: string, requestedUserCount?: number): Promise<void> => {
    const seatLimit = getSelfSeatLimit()
    if (seatLimit === -1) return

    const userCount = requestedUserCount ?? (await getOrganizationUserCount(source, organizationId))
    if (userCount > seatLimit) throw new FlowOpsAuthError(StatusCodes.PAYMENT_REQUIRED, SELF_SEAT_LIMIT_EXCEEDED_MESSAGE)
}

export const assertCanAddOrganizationUser = async (source: RepositorySource, organizationId: string): Promise<void> => {
    const currentUserCount = await getOrganizationUserCount(source, organizationId)
    await assertSelfSeatLimit(source, organizationId, currentUserCount + 1)
}

export const assertUserOrganizationsWithinSeatLimit = async (source: RepositorySource, userId: string): Promise<void> => {
    const memberships = await source.getRepository(FlowOpsWorkspaceMember).findBy({ userId })
    const organizationIds = new Set<string>()
    for (const membership of memberships) {
        const workspace = await source.getRepository(FlowOpsWorkspace).findOneBy({ id: membership.workspaceId })
        if (workspace?.organizationId) organizationIds.add(workspace.organizationId)
    }

    const ownedOrganizations = await source.getRepository(FlowOpsOrganization).findBy({ ownerUserId: userId })
    for (const organization of ownedOrganizations) organizationIds.add(organization.id)

    for (const organizationId of organizationIds) await assertSelfSeatLimit(source, organizationId)
}
