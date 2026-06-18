import type { DataSource, SelectQueryBuilder } from 'typeorm'
import logger from '../../../utils/logger'
import { FlowOpsAuditLog } from '../entities'
export type { AuditActorContext, AuthenticatedAuditActorContext } from './types'

export type AuditEventStatus = 'success' | 'failure'

export type RecordAuditEventInput = {
    actorUserId?: string | null
    actorEmail?: string | null
    action: string
    targetType: string
    targetId?: string | null
    targetName?: string | null
    organizationId?: string | null
    workspaceId?: string | null
    status: AuditEventStatus
    ip?: string | null
    userAgent?: string | null
    metadata?: Record<string, unknown> | null
}

export type AuditLogFilters = {
    organizationId: string
    actorUserId?: string
    action?: string
    targetType?: string
    dateFrom?: Date | string
    dateTo?: Date | string
    workspaceId?: string
}

export type AuditLogPage = {
    pageNo?: number | string
    pageSize?: number | string
}

export type AuditLogResult = Omit<FlowOpsAuditLog, 'metadata'> & {
    metadata: unknown | null
}

const SENSITIVE_METADATA_KEYS = new Set([
    'accesstoken',
    'authorization',
    'cookie',
    'credential',
    'credentialhash',
    'invitelink',
    'jwt',
    'password',
    'refreshtoken',
    'resetlink',
    'setcookie',
    'temptoken',
    'token'
])

const normalizeMetadataKey = (key: string): string => key.replace(/[^a-z0-9]/gi, '').toLowerCase()

const sanitizeMetadataValue = (value: unknown, seen: WeakSet<object>): unknown => {
    if (value === null || typeof value !== 'object') return value
    if (value instanceof Date) return value.toISOString()
    if (seen.has(value)) return undefined
    seen.add(value)

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeMetadataValue(item, seen)).filter((item) => item !== undefined)
    }

    const sanitized: Record<string, unknown> = {}
    for (const [key, nestedValue] of Object.entries(value)) {
        if (SENSITIVE_METADATA_KEYS.has(normalizeMetadataKey(key))) continue
        const nextValue = sanitizeMetadataValue(nestedValue, seen)
        if (nextValue !== undefined) sanitized[key] = nextValue
    }
    return sanitized
}

const serializeMetadata = (metadata?: Record<string, unknown> | null): string => {
    return JSON.stringify(sanitizeMetadataValue(metadata ?? {}, new WeakSet<object>()))
}

const parseMetadata = (metadata: string): unknown | null => {
    try {
        return JSON.parse(metadata)
    } catch {
        return null
    }
}

const toPositiveInteger = (value: number | string | undefined, fallback: number): number => {
    const parsed = Number(value)
    return Number.isFinite(parsed) && parsed > 0 ? Math.floor(parsed) : fallback
}

const toDate = (value: Date | string | undefined, field: string): Date | undefined => {
    if (value === undefined) return undefined
    const date = value instanceof Date ? value : new Date(value)
    if (!Number.isFinite(date.getTime())) throw new Error(`${field} must be a valid date`)
    return date
}

const toResult = (row: FlowOpsAuditLog): AuditLogResult => ({
    ...row,
    metadata: parseMetadata(row.metadata)
})

export class FlowOpsAuditService {
    constructor(private readonly dataSource: DataSource) {}

    async recordAuditEvent(input: RecordAuditEventInput): Promise<void> {
        try {
            const repository = this.dataSource.getRepository(FlowOpsAuditLog)
            await repository.save(
                repository.create({
                    actorUserId: input.actorUserId ?? null,
                    actorEmail: input.actorEmail ?? null,
                    action: input.action,
                    targetType: input.targetType,
                    targetId: input.targetId ?? null,
                    targetName: input.targetName ?? null,
                    organizationId: input.organizationId ?? null,
                    workspaceId: input.workspaceId ?? null,
                    status: input.status,
                    ip: input.ip ?? null,
                    userAgent: input.userAgent ?? null,
                    metadata: serializeMetadata(input.metadata)
                })
            )
        } catch (error) {
            logger.warn(`[FlowOps audit] Failed to record ${input.action}: ${error instanceof Error ? error.message : String(error)}`)
        }
    }

    async queryAuditLogs(filters: AuditLogFilters, page: AuditLogPage = {}) {
        const currentPage = toPositiveInteger(page.pageNo, 1)
        const pageSize = toPositiveInteger(page.pageSize, 50)
        const query = this.buildScopedQuery(filters)
            .orderBy('audit.createdDate', 'DESC')
            .addOrderBy('audit.id', 'DESC')
            .skip((currentPage - 1) * pageSize)
            .take(pageSize)
        const [rows, count] = await query.getManyAndCount()

        return {
            data: rows.map(toResult),
            count,
            currentPage,
            pageSize
        }
    }

    async exportAuditLogs(filters: AuditLogFilters): Promise<AuditLogResult[]> {
        const rows = await this.buildScopedQuery(filters).orderBy('audit.createdDate', 'DESC').addOrderBy('audit.id', 'DESC').getMany()
        return rows.map(toResult)
    }

    private buildScopedQuery(filters: AuditLogFilters): SelectQueryBuilder<FlowOpsAuditLog> {
        const organizationId = filters.organizationId?.trim()
        if (!organizationId) throw new Error('organizationId is required')

        const query = this.dataSource
            .getRepository(FlowOpsAuditLog)
            .createQueryBuilder('audit')
            .where('audit.organizationId = :organizationId', { organizationId })

        if (filters.actorUserId) query.andWhere('audit.actorUserId = :actorUserId', { actorUserId: filters.actorUserId })
        if (filters.action) query.andWhere('audit.action = :action', { action: filters.action })
        if (filters.targetType) query.andWhere('audit.targetType = :targetType', { targetType: filters.targetType })
        if (filters.workspaceId) query.andWhere('audit.workspaceId = :workspaceId', { workspaceId: filters.workspaceId })

        const dateFrom = toDate(filters.dateFrom, 'dateFrom')
        const dateTo = toDate(filters.dateTo, 'dateTo')
        if (dateFrom) query.andWhere('audit.createdDate >= :dateFrom', { dateFrom })
        if (dateTo) query.andWhere('audit.createdDate <= :dateTo', { dateTo })

        return query
    }
}
