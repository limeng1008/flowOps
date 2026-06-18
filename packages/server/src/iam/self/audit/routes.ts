import { NextFunction, Request, Response, Router } from 'express'
import { getDataSource } from '../../../DataSource'
import { checkFeatureByPlan } from '../../identity'
import { checkPermission } from '../middleware'
import { toAuthenticatedAuditActor } from './context'
import { AuditLogFilters, AuditLogResult, FlowOpsAuditService } from './service'

type AuditService = Pick<FlowOpsAuditService, 'queryAuditLogs' | 'exportAuditLogs'>
type AuditServiceFactory = () => AuditService

const queryString = (value: unknown): string | undefined => (typeof value === 'string' && value.length > 0 ? value : undefined)
const LEGACY_ACTIVITY_CODES = new Set(['0', '1', '-1', '-2', '-3', '-4', '-99'])

const requestedLegacyActivityCodes = (value: unknown): string[] | undefined => {
    if (!Array.isArray(value)) return undefined
    const activityCodes = value.map(String).filter((activityCode) => LEGACY_ACTIVITY_CODES.has(activityCode))
    return activityCodes.length > 0 ? [...new Set(activityCodes)] : undefined
}

const scopedFilters = (req: Request): AuditLogFilters | null => {
    const actor = toAuthenticatedAuditActor(req)
    if (!actor?.activeOrganizationId) return null
    return {
        organizationId: actor.activeOrganizationId,
        ...(queryString(req.query.actorUserId) ? { actorUserId: queryString(req.query.actorUserId) } : {}),
        ...(queryString(req.query.action) ? { action: queryString(req.query.action) } : {}),
        ...(queryString(req.query.targetType) ? { targetType: queryString(req.query.targetType) } : {}),
        ...(queryString(req.query.workspaceId) ? { workspaceId: queryString(req.query.workspaceId) } : {}),
        ...(queryString(req.query.dateFrom) ? { dateFrom: queryString(req.query.dateFrom) } : {}),
        ...(queryString(req.query.dateTo) ? { dateTo: queryString(req.query.dateTo) } : {})
    }
}

const csvCell = (value: unknown): string => {
    const text = value === null || value === undefined ? '' : typeof value === 'string' ? value : JSON.stringify(value)
    const safe = /^[=+\-@]/.test(text) ? `'${text}` : text
    return `"${safe.replace(/"/g, '""')}"`
}

const toCsv = (rows: AuditLogResult[]): string => {
    const columns: Array<{ header: string; value: (row: AuditLogResult) => unknown }> = [
        { header: 'createdDate', value: (row) => row.createdDate?.toISOString?.() ?? row.createdDate },
        { header: 'actorUserId', value: (row) => row.actorUserId },
        { header: 'actorEmail', value: (row) => row.actorEmail },
        { header: 'action', value: (row) => row.action },
        { header: 'targetType', value: (row) => row.targetType },
        { header: 'targetId', value: (row) => row.targetId },
        { header: 'targetName', value: (row) => row.targetName },
        { header: 'organizationId', value: (row) => row.organizationId },
        { header: 'workspaceId', value: (row) => row.workspaceId },
        { header: 'status', value: (row) => row.status },
        { header: 'ip', value: (row) => row.ip },
        { header: 'userAgent', value: (row) => row.userAgent },
        { header: 'metadata', value: (row) => row.metadata }
    ]
    return [
        columns.map((column) => csvCell(column.header)).join(','),
        ...rows.map((row) => columns.map((column) => csvCell(column.value(row))).join(','))
    ].join('\n')
}

const legacyActivityCode = (row: AuditLogResult): number | null => {
    const metadata = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {}
    const storedCode = Number(metadata.legacyActivityCode)
    if (Number.isFinite(storedCode)) return storedCode
    if (row.action === 'auth.login') return 0
    if (row.action === 'auth.logout') return 1
    return null
}

const legacyLoginActivity = (row: AuditLogResult) => {
    const metadata = row.metadata && typeof row.metadata === 'object' ? (row.metadata as Record<string, unknown>) : {}
    return {
        id: row.id,
        userId: row.actorUserId,
        username: row.actorEmail ?? row.targetName ?? 'Unknown User',
        activityCode: legacyActivityCode(row),
        attemptedDateTime: row.createdDate,
        loginMode: null,
        message: typeof metadata.reason === 'string' ? metadata.reason : row.action,
        ip: row.ip
    }
}

const sendError = (error: unknown, _res: Response, next: NextFunction) => next(error)

export const createAuditRouter = (serviceFactory: AuditServiceFactory = () => new FlowOpsAuditService(getDataSource())): Router => {
    const router = Router()
    const gates = [checkPermission('auditLogs:view'), checkFeatureByPlan('feat:audit')]

    router.get('/export', ...gates, async (req, res, next) => {
        try {
            const filters = scopedFilters(req)
            if (!filters) return res.status(401).json({ message: 'Unauthorized' })
            const rows = await serviceFactory().exportAuditLogs(filters)
            res.setHeader('Content-Type', 'text/csv; charset=utf-8')
            res.setHeader('Content-Disposition', 'attachment; filename="flowops-audit-logs.csv"')
            return res.send(toCsv(rows))
        } catch (error) {
            return sendError(error, res, next)
        }
    })

    router.get('/', ...gates, async (req, res, next) => {
        try {
            const filters = scopedFilters(req)
            if (!filters) return res.status(401).json({ message: 'Unauthorized' })
            return res.json(
                await serviceFactory().queryAuditLogs(filters, {
                    pageNo: queryString(req.query.pageNo),
                    pageSize: queryString(req.query.pageSize)
                })
            )
        } catch (error) {
            return sendError(error, res, next)
        }
    })

    router.post('/login-activity', ...gates, async (req, res, next) => {
        try {
            const actor = toAuthenticatedAuditActor(req)
            if (!actor?.activeOrganizationId) return res.status(401).json({ message: 'Unauthorized' })
            const legacyActivityCodes = requestedLegacyActivityCodes(req.body?.activityCodes)
            const result = await serviceFactory().queryAuditLogs(
                {
                    organizationId: actor.activeOrganizationId,
                    actionPrefix: 'auth.',
                    ...(legacyActivityCodes ? { legacyActivityCodes } : {}),
                    ...(req.body?.startDate ? { dateFrom: req.body.startDate } : {}),
                    ...(req.body?.endDate ? { dateTo: req.body.endDate } : {})
                },
                { pageNo: req.body?.pageNo, pageSize: req.body?.pageSize }
            )
            return res.json({ ...result, data: result.data.map(legacyLoginActivity) })
        } catch (error) {
            return sendError(error, res, next)
        }
    })

    return router
}

export const auditRouter = createAuditRouter()
