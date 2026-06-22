import auditApi, { exportAuditLogs, getAuditLogs } from './audit'
import client from './client'

jest.mock('./client', () => ({
    __esModule: true,
    default: {
        get: jest.fn()
    }
}))

describe('audit API', () => {
    beforeEach(() => {
        client.get.mockReset()
    })

    it('queries audit logs with server-side filters and pagination', async () => {
        const params = {
            actorUserId: 'user-1',
            action: 'auth.*',
            targetType: 'user',
            workspaceId: 'workspace-1',
            dateFrom: '2026-06-01T00:00:00.000Z',
            dateTo: '2026-06-18T23:59:59.999Z',
            pageNo: 2,
            pageSize: 24
        }
        client.get.mockResolvedValue({ data: { data: [], count: 0 } })

        await getAuditLogs(params)

        expect(client.get).toHaveBeenCalledWith('/audit', { params })
        expect(auditApi.getAuditLogs).toBe(getAuditLogs)
    })

    it('requests the matching CSV as a blob', async () => {
        const params = { action: 'role.*', dateFrom: '2026-06-01T00:00:00.000Z' }
        client.get.mockResolvedValue({ data: new Blob(['csv']) })

        await exportAuditLogs(params)

        expect(client.get).toHaveBeenCalledWith('/audit/export', { params, responseType: 'blob' })
        expect(auditApi.exportAuditLogs).toBe(exportAuditLogs)
    })
})
