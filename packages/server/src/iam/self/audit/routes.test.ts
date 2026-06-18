import express from 'express'
import request from 'supertest'
import { LicenseVerificationResult } from '../../../services/license'
import { setLicenseState } from '../../../services/license/state'
import { createAuditRouter } from './routes'

const makeLicenseState = (
    status: LicenseVerificationResult['status'],
    overrides: Partial<LicenseVerificationResult> = {}
): LicenseVerificationResult => ({
    valid: status === 'active' || status === 'grace',
    status,
    readOnly: status === 'grace' || status === 'expired',
    features: [],
    machineFingerprint: [],
    currentFingerprint: 'fp-test',
    ...overrides
})

const makeAuditRow = (overrides: Record<string, unknown> = {}) => ({
    id: 'audit-1',
    createdDate: new Date('2026-06-18T10:00:00.000Z'),
    actorUserId: 'user-1',
    actorEmail: 'owner@example.com',
    action: 'role.update',
    targetType: 'role',
    targetId: 'role-1',
    targetName: 'operator',
    organizationId: 'org-1',
    workspaceId: 'workspace-1',
    status: 'success',
    ip: '127.0.0.1',
    userAgent: 'jest',
    metadata: { before: { name: 'viewer' } },
    ...overrides
})

describe('FlowOps audit routes', () => {
    const originalEdition = process.env.FLOWOPS_EDITION
    const originalLocalCommercial = process.env.FLOWOPS_LOCAL_COMMERCIAL
    const queryAuditLogs = jest.fn()
    const exportAuditLogs = jest.fn()

    const buildApp = () => {
        const app = express()
        app.use(express.json())
        app.use((req, _res, next) => {
            const mode = req.header('x-test-user')
            if (mode) {
                req.user = {
                    id: 'user-1',
                    email: 'owner@example.com',
                    activeOrganizationId: 'org-1',
                    activeWorkspaceId: 'workspace-1',
                    isOrganizationAdmin: false,
                    permissions: mode === 'allowed' ? ['auditLogs:view'] : []
                } as any
            }
            next()
        })
        app.use(
            '/audit',
            createAuditRouter(() => ({ queryAuditLogs, exportAuditLogs } as any))
        )
        return app
    }

    beforeEach(() => {
        delete process.env.FLOWOPS_EDITION
        delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        setLicenseState(makeLicenseState('missing', { valid: false, readOnly: false, reason: 'LICENSE_NOT_IMPORTED' }))
        queryAuditLogs.mockReset().mockResolvedValue({ data: [makeAuditRow()], count: 1, currentPage: 1, pageSize: 50 })
        exportAuditLogs.mockReset().mockResolvedValue([makeAuditRow()])
    })

    afterAll(() => {
        if (originalEdition === undefined) delete process.env.FLOWOPS_EDITION
        else process.env.FLOWOPS_EDITION = originalEdition
        if (originalLocalCommercial === undefined) delete process.env.FLOWOPS_LOCAL_COMMERCIAL
        else process.env.FLOWOPS_LOCAL_COMMERCIAL = originalLocalCommercial
    })

    it('requires both auditLogs:view and feat:audit', async () => {
        const app = buildApp()

        const free = await request(app).get('/audit').set('x-test-user', 'allowed')
        expect(free.status).toBe(403)

        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        const noPermission = await request(app).get('/audit').set('x-test-user', 'denied')
        expect(noPermission.status).toBe(403)

        const allowed = await request(app).get('/audit').set('x-test-user', 'allowed')
        expect(allowed.status).toBe(200)
    })

    it('forces organization scope from the authenticated user and forwards supported filters', async () => {
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        const app = buildApp()

        const response = await request(app).get('/audit').set('x-test-user', 'allowed').query({
            organizationId: 'org-attacker',
            actorUserId: 'actor-2',
            action: 'workspace.update',
            targetType: 'workspace',
            workspaceId: 'workspace-2',
            dateFrom: '2026-06-01T00:00:00.000Z',
            dateTo: '2026-06-30T23:59:59.999Z',
            pageNo: '2',
            pageSize: '25'
        })

        expect(response.status).toBe(200)
        expect(queryAuditLogs).toHaveBeenCalledWith(
            {
                organizationId: 'org-1',
                actorUserId: 'actor-2',
                action: 'workspace.update',
                targetType: 'workspace',
                workspaceId: 'workspace-2',
                dateFrom: '2026-06-01T00:00:00.000Z',
                dateTo: '2026-06-30T23:59:59.999Z'
            },
            { pageNo: '2', pageSize: '25' }
        )
    })

    it.each([
        ['auth.*', 'auth.'],
        ['role.*', 'role.']
    ])('translates the %s action wildcard into the %s prefix within the authenticated organization', async (action, actionPrefix) => {
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        const app = buildApp()

        const response = await request(app).get('/audit').set('x-test-user', 'allowed').query({ action, organizationId: 'org-attacker' })

        expect(response.status).toBe(200)
        expect(queryAuditLogs).toHaveBeenCalledWith({ organizationId: 'org-1', actionPrefix }, { pageNo: undefined, pageSize: undefined })
    })

    it('keeps non-wildcard actions as exact matches', async () => {
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        const app = buildApp()

        const response = await request(app).get('/audit').set('x-test-user', 'allowed').query({ action: 'role.create' })

        expect(response.status).toBe(200)
        expect(queryAuditLogs).toHaveBeenCalledWith(
            { organizationId: 'org-1', action: 'role.create' },
            { pageNo: undefined, pageSize: undefined }
        )
    })

    it('exports CSV while neutralizing spreadsheet formulas', async () => {
        setLicenseState(makeLicenseState('active', { tier: 'enterprise' }))
        exportAuditLogs.mockResolvedValue([
            makeAuditRow({
                actorEmail: '+cmd@example.com',
                targetName: '=SUM(1,1)',
                metadata: { note: '@unsafe', change: '-1' }
            })
        ])
        const app = buildApp()

        const response = await request(app).get('/audit/export').set('x-test-user', 'allowed').query({ organizationId: 'org-attacker' })

        expect(response.status).toBe(200)
        expect(response.headers['content-type']).toContain('text/csv')
        expect(response.headers['content-disposition']).toContain('flowops-audit-logs.csv')
        expect(response.text).toContain("'+cmd@example.com")
        expect(response.text).toContain("'=SUM(1,1)")
        expect(exportAuditLogs).toHaveBeenCalledWith({ organizationId: 'org-1' })
    })

    it('serves login-activity compatibility data from auth audit actions in the caller organization', async () => {
        setLicenseState(makeLicenseState('active', { tier: 'team' }))
        queryAuditLogs.mockResolvedValue({
            data: [
                makeAuditRow({
                    action: 'auth.loginFailed',
                    status: 'failure',
                    metadata: { legacyActivityCode: '-2', reason: 'INVALID_CREDENTIAL' }
                })
            ],
            count: 1,
            currentPage: 1,
            pageSize: 10
        })
        const app = buildApp()

        const response = await request(app)
            .post('/audit/login-activity')
            .set('x-test-user', 'allowed')
            .send({ organizationId: 'org-attacker', pageNo: 1, pageSize: 10, activityCodes: [-2] })

        expect(response.status).toBe(200)
        expect(queryAuditLogs).toHaveBeenCalledWith(
            { organizationId: 'org-1', actionPrefix: 'auth.', legacyActivityCodes: ['-2'] },
            { pageNo: 1, pageSize: 10 }
        )
        expect(response.body.data).toEqual([
            expect.objectContaining({ activityCode: -2, username: 'owner@example.com', message: 'INVALID_CREDENTIAL' })
        ])
    })
})
