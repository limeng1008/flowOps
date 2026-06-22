export type AuditActorContext = {
    actorUserId: string | null
    actorEmail: string | null
    ip?: string
    userAgent?: string
}

export type AuthenticatedAuditActorContext = AuditActorContext & {
    actorUserId: string
    actorEmail: string
}
