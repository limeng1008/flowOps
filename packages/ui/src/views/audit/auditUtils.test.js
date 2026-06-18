import { AUDIT_ACTION_GROUPS, buildAuditParams, createAuditFilters, normalizeAuditMetadata } from './auditUtils'

describe('audit page helpers', () => {
    it('hydrates the action filter from the legacy redirect query', () => {
        expect(createAuditFilters('auth.*')).toEqual({
            actorUserId: '',
            action: 'auth.*',
            targetType: '',
            workspaceId: '',
            dateFrom: '',
            dateTo: ''
        })
    })

    it('builds trimmed server filters, ISO dates, and pagination without blank values', () => {
        expect(
            buildAuditParams(
                {
                    actorUserId: ' user-1 ',
                    action: 'role.create',
                    targetType: '',
                    workspaceId: ' workspace-1 ',
                    dateFrom: '2026-06-01T08:30:00.000Z',
                    dateTo: '2026-06-18T12:45:00.000Z'
                },
                2,
                24
            )
        ).toEqual({
            actorUserId: 'user-1',
            action: 'role.create',
            workspaceId: 'workspace-1',
            dateFrom: '2026-06-01T08:30:00.000Z',
            dateTo: '2026-06-18T12:45:00.000Z',
            pageNo: 2,
            pageSize: 24
        })
    })

    it('keeps the approved wildcard and exact action choices visible', () => {
        const values = AUDIT_ACTION_GROUPS.flatMap((group) => group.actions.map((action) => action.value))

        expect(values).toEqual(expect.arrayContaining(['auth.*', 'auth.login', 'auth.logout', 'auth.loginFailed', 'role.*', 'role.create']))
    })

    it('normalizes object and serialized metadata without throwing on malformed input', () => {
        expect(normalizeAuditMetadata({ before: { name: 'viewer' } })).toEqual({ before: { name: 'viewer' } })
        expect(normalizeAuditMetadata('{"after":{"name":"operator"}}')).toEqual({ after: { name: 'operator' } })
        expect(normalizeAuditMetadata('{malformed')).toEqual({})
    })
})
