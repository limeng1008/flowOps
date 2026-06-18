import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import type { DataSource } from 'typeorm'
import { DataSource as SqliteDataSource, EntitySchema } from '../../../../node_modules/typeorm'
import logger from '../../../utils/logger'
import { FlowOpsAuditService } from './service'

type TestAuditRow = {
    id: string
    createdDate: Date
    actorUserId?: string | null
    actorEmail?: string | null
    action: string
    targetType: string
    targetId?: string | null
    targetName?: string | null
    organizationId?: string | null
    workspaceId?: string | null
    status: string
    ip?: string | null
    userAgent?: string | null
    metadata: string
}

const auditSchema = new EntitySchema<TestAuditRow>({
    name: 'TestFlowOpsAuditLog',
    tableName: 'flowops_audit_log',
    columns: {
        id: { type: String, primary: true, generated: 'uuid' },
        createdDate: { type: Date, createDate: true },
        actorUserId: { type: String, nullable: true },
        actorEmail: { type: String, nullable: true },
        action: { type: String },
        targetType: { type: String },
        targetId: { type: String, nullable: true },
        targetName: { type: String, nullable: true },
        organizationId: { type: String, nullable: true },
        workspaceId: { type: String, nullable: true },
        status: { type: String },
        ip: { type: String, nullable: true },
        userAgent: { type: String, nullable: true },
        metadata: { type: 'text' }
    }
})

describe('FlowOpsAuditService', () => {
    let sqlite: SqliteDataSource
    let dataSource: DataSource
    let service: FlowOpsAuditService

    beforeEach(async () => {
        sqlite = new SqliteDataSource({
            type: 'sqlite',
            database: ':memory:',
            dropSchema: true,
            synchronize: true,
            entities: [auditSchema]
        })
        await sqlite.initialize()
        dataSource = {
            getRepository: () => sqlite.getRepository(auditSchema)
        } as unknown as DataSource
        service = new FlowOpsAuditService(dataSource)
    })

    afterEach(async () => {
        jest.restoreAllMocks()
        if (sqlite.isInitialized) await sqlite.destroy()
    })

    const seedAuditRows = async () => {
        await sqlite.getRepository(auditSchema).save([
            {
                id: '00000000-0000-4000-8000-000000000001',
                createdDate: new Date('2026-01-01T00:00:00.000Z'),
                actorUserId: 'actor-1',
                actorEmail: 'actor-1@example.com',
                action: 'role.update',
                targetType: 'role',
                targetId: 'role-1',
                targetName: 'viewer',
                organizationId: 'org-1',
                workspaceId: 'workspace-1',
                status: 'success',
                metadata: JSON.stringify({ version: 1 })
            },
            {
                id: '00000000-0000-4000-8000-000000000002',
                createdDate: new Date('2026-01-02T00:00:00.000Z'),
                actorUserId: 'actor-1',
                actorEmail: 'actor-1@example.com',
                action: 'role.update',
                targetType: 'role',
                targetId: 'role-1',
                targetName: 'analyst',
                organizationId: 'org-1',
                workspaceId: 'workspace-1',
                status: 'success',
                metadata: '{malformed'
            },
            {
                id: '00000000-0000-4000-8000-000000000003',
                createdDate: new Date('2026-01-03T00:00:00.000Z'),
                actorUserId: 'actor-2',
                actorEmail: 'actor-2@example.com',
                action: 'role.create',
                targetType: 'role',
                targetId: 'role-2',
                targetName: 'operator',
                organizationId: 'org-1',
                workspaceId: 'workspace-2',
                status: 'success',
                metadata: '{}'
            },
            {
                id: '00000000-0000-4000-8000-000000000004',
                createdDate: new Date('2026-01-04T00:00:00.000Z'),
                actorUserId: 'actor-1',
                actorEmail: 'actor-1@example.com',
                action: 'role.update',
                targetType: 'role',
                targetId: 'role-private',
                targetName: 'other organization',
                organizationId: 'org-2',
                workspaceId: 'workspace-1',
                status: 'success',
                metadata: JSON.stringify({ mustNotLeak: true })
            }
        ])
    }

    it('records an audit event while removing sensitive metadata recursively', async () => {
        await service.recordAuditEvent({
            actorUserId: 'user-1',
            actorEmail: 'owner@example.com',
            action: 'role.update',
            targetType: 'role',
            targetId: 'role-1',
            targetName: 'analyst',
            organizationId: 'org-1',
            workspaceId: 'workspace-1',
            status: 'success',
            ip: '127.0.0.1',
            userAgent: 'jest',
            metadata: {
                before: { name: 'viewer', password: 'must-not-persist' },
                after: {
                    name: 'analyst',
                    tempToken: 'must-not-persist',
                    inviteLink: 'must-not-persist',
                    resetLink: 'must-not-persist'
                },
                authorization: 'Bearer secret',
                jwt: 'must-not-persist'
            }
        })

        const rows = await sqlite.getRepository(auditSchema).find()
        expect(rows).toHaveLength(1)
        expect(rows[0]).toMatchObject({
            actorUserId: 'user-1',
            actorEmail: 'owner@example.com',
            action: 'role.update',
            targetType: 'role',
            targetId: 'role-1',
            targetName: 'analyst',
            organizationId: 'org-1',
            workspaceId: 'workspace-1',
            status: 'success',
            ip: '127.0.0.1',
            userAgent: 'jest'
        })
        expect(JSON.parse(rows[0].metadata)).toEqual({
            before: { name: 'viewer' },
            after: { name: 'analyst' }
        })
    })

    it('warns and resolves when the audit repository fails', async () => {
        const repositoryError = new Error('database unavailable')
        const failingDataSource = {
            getRepository: () => ({
                create: jest.fn((value) => value),
                save: jest.fn().mockRejectedValue(repositoryError)
            })
        } as unknown as DataSource
        const warn = jest.spyOn(logger, 'warn').mockReturnValue(logger)

        await expect(
            new FlowOpsAuditService(failingDataSource).recordAuditEvent({
                action: 'role.update',
                targetType: 'role',
                organizationId: 'org-1',
                status: 'success'
            })
        ).resolves.toBeUndefined()

        expect(warn).toHaveBeenCalledWith(expect.stringContaining('database unavailable'))
    })

    it('filters in the database, enforces organization scope, sorts, and paginates', async () => {
        await seedAuditRows()

        const result = await service.queryAuditLogs(
            {
                organizationId: 'org-1',
                actorUserId: 'actor-1',
                action: 'role.update',
                targetType: 'role',
                workspaceId: 'workspace-1',
                dateFrom: new Date('2026-01-01T00:00:00.000Z'),
                dateTo: new Date('2026-01-02T23:59:59.999Z')
            },
            { pageNo: 1, pageSize: 1 }
        )

        expect(result).toEqual({
            data: [
                expect.objectContaining({
                    id: '00000000-0000-4000-8000-000000000002',
                    organizationId: 'org-1',
                    metadata: null
                })
            ],
            count: 2,
            currentPage: 1,
            pageSize: 1
        })
    })

    it('requires an organization scope for queries', async () => {
        await expect(service.queryAuditLogs({} as any, { pageNo: 1, pageSize: 50 })).rejects.toThrow('organizationId is required')
    })

    it('exports every matching row in descending order without crossing organizations', async () => {
        await seedAuditRows()

        const rows = await service.exportAuditLogs({ organizationId: 'org-1', action: 'role.update' })

        expect(rows.map((row) => row.id)).toEqual(['00000000-0000-4000-8000-000000000002', '00000000-0000-4000-8000-000000000001'])
        expect(rows[1].metadata).toEqual({ version: 1 })
        expect(rows.every((row) => row.organizationId === 'org-1')).toBe(true)
    })
})
