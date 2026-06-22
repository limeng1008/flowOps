import type { Request } from 'express'
import type { FlowOpsLoggedInUser } from '../auth/types'
import type { AuditActorContext, AuthenticatedAuditActorContext } from './types'

export type FlowOpsAuthenticatedAuditActor = FlowOpsLoggedInUser & AuthenticatedAuditActorContext

export const toAuditRequestContext = (req: Request): AuditActorContext => ({
    actorUserId: null,
    actorEmail: null,
    ip: req.ip,
    userAgent: req.get('user-agent')
})

export const toAuthenticatedAuditActor = (req: Request): FlowOpsAuthenticatedAuditActor | null => {
    const actor = req.user as FlowOpsLoggedInUser | undefined
    if (!actor?.id || !actor.email) return null
    return {
        ...actor,
        actorUserId: actor.id,
        actorEmail: actor.email,
        ip: req.ip,
        userAgent: req.get('user-agent')
    }
}
