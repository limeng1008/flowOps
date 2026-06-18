import { QueryRunner } from 'typeorm'

type LegacyLoginActivityRow = {
    id: string
    userId?: string | null
    activityCode: string | number
    ip?: string | null
    message?: string | null
    createdDate?: Date | string | null
    updatedDate?: Date | string | null
    actorEmail?: string | null
}

export type MigratedAuditLogRow = {
    id: string
    createdDate: Date | string
    actorUserId: string | null
    actorEmail: string | null
    action: 'auth.login' | 'auth.logout' | 'auth.loginFailed'
    targetType: 'user'
    targetId: string | null
    targetName: string | null
    organizationId: null
    workspaceId: null
    status: 'success' | 'failure'
    ip: string | null
    userAgent: null
    metadata: string
}

export const mapLegacyLoginActivity = (row: LegacyLoginActivityRow): MigratedAuditLogRow => {
    const activityCode = String(row.activityCode)
    const action = activityCode === '0' ? 'auth.login' : activityCode === '1' ? 'auth.logout' : 'auth.loginFailed'
    const status = activityCode === '0' || activityCode === '1' ? 'success' : 'failure'

    return {
        id: row.id,
        createdDate: row.createdDate ?? row.updatedDate ?? new Date(),
        actorUserId: row.userId ?? null,
        actorEmail: row.actorEmail ?? null,
        action,
        targetType: 'user',
        targetId: row.userId ?? null,
        targetName: row.actorEmail ?? null,
        organizationId: null,
        workspaceId: null,
        status,
        ip: row.ip ?? null,
        userAgent: null,
        metadata: JSON.stringify({
            legacyActivityCode: activityCode,
            message: row.message ?? null,
            migratedFrom: 'flowops_login_activity'
        })
    }
}

export const migrateLegacyLoginActivities = async (queryRunner: QueryRunner, identifierQuote: '`' | '"'): Promise<void> => {
    const quote = (identifier: string) => `${identifierQuote}${identifier}${identifierQuote}`
    const rows = (await queryRunner.query(`
        SELECT
            activity.${quote('id')} AS ${quote('id')},
            activity.${quote('userId')} AS ${quote('userId')},
            activity.${quote('activityCode')} AS ${quote('activityCode')},
            activity.${quote('ip')} AS ${quote('ip')},
            activity.${quote('message')} AS ${quote('message')},
            activity.${quote('createdDate')} AS ${quote('createdDate')},
            activity.${quote('updatedDate')} AS ${quote('updatedDate')},
            actor.${quote('email')} AS ${quote('actorEmail')}
        FROM ${quote('flowops_login_activity')} activity
        LEFT JOIN ${quote('flowops_user')} actor ON actor.${quote('id')} = activity.${quote('userId')}
    `)) as LegacyLoginActivityRow[]

    if (rows.length === 0) return
    await queryRunner.manager.createQueryBuilder().insert().into('flowops_audit_log').values(rows.map(mapLegacyLoginActivity)).execute()
}
