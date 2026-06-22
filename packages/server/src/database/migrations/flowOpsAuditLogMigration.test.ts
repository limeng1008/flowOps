import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals'
import { DataSource as SqliteDataSource } from '../../../node_modules/typeorm'
import { AddFlowOpsAuditLog1779100000000 } from './sqlite/1779100000000-AddFlowOpsAuditLog'

describe('FlowOps audit migration', () => {
    let dataSource: SqliteDataSource

    beforeEach(async () => {
        dataSource = new SqliteDataSource({ type: 'sqlite', database: ':memory:' })
        await dataSource.initialize()
        await dataSource.query(`
            CREATE TABLE "flowops_user" (
                "id" varchar PRIMARY KEY NOT NULL,
                "email" varchar(255) NOT NULL
            )
        `)
        await dataSource.query(`
            CREATE TABLE "flowops_login_activity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "userId" text,
                "activityCode" varchar(50) NOT NULL,
                "ip" varchar(100),
                "message" text,
                "createdDate" datetime,
                "updatedDate" datetime
            )
        `)
        await dataSource.query(`INSERT INTO "flowops_user" ("id", "email") VALUES ('user-1', 'owner@example.com')`)
        await dataSource.query(`
            INSERT INTO "flowops_login_activity"
                ("id", "userId", "activityCode", "ip", "message", "createdDate", "updatedDate")
            VALUES
                ('00000000-0000-4000-8000-000000000001', 'user-1', '0', '127.0.0.1', 'Login Successful', '2026-01-01 00:00:00', '2026-01-01 00:00:00'),
                ('00000000-0000-4000-8000-000000000002', 'user-1', '1', NULL, 'Logout Successful', '2026-01-02 00:00:00', '2026-01-02 00:00:00'),
                ('00000000-0000-4000-8000-000000000003', 'user-1', '-2', NULL, 'Incorrect credential', '2026-01-03 00:00:00', '2026-01-03 00:00:00'),
                ('00000000-0000-4000-8000-000000000004', NULL, '-1', NULL, 'Missing user id', '2026-01-04 00:00:00', '2026-01-04 00:00:00'),
                ('00000000-0000-4000-8000-000000000005', 'missing-user', '-1', NULL, 'Unknown user', '2026-01-05 00:00:00', '2026-01-05 00:00:00')
        `)
    })

    afterEach(async () => {
        if (dataSource.isInitialized) await dataSource.destroy()
    })

    it('creates indexes and migrates legacy login activity without dropping the legacy table', async () => {
        const queryRunner = dataSource.createQueryRunner()
        const querySpy = jest.spyOn(queryRunner, 'query')
        await new AddFlowOpsAuditLog1779100000000().up(queryRunner)

        const migrationSql = querySpy.mock.calls.map(([sql]) => String(sql))
        expect(migrationSql.some((sql) => /\bJOIN\b/i.test(sql))).toBe(false)
        expect(migrationSql.some((sql) => /FROM\s+"flowops_user"\s*$/im.test(sql.trim()))).toBe(true)

        const rows = (await dataSource.query(`SELECT * FROM "flowops_audit_log" ORDER BY "createdDate" ASC`)) as Array<{
            id: string
            actorEmail: string | null
            action: string
            status: string
            metadata: string
        }>
        expect(rows).toHaveLength(5)
        expect(rows.map(({ action, status }) => ({ action, status }))).toEqual([
            { action: 'auth.login', status: 'success' },
            { action: 'auth.logout', status: 'success' },
            { action: 'auth.loginFailed', status: 'failure' },
            { action: 'auth.loginFailed', status: 'failure' },
            { action: 'auth.loginFailed', status: 'failure' }
        ])
        expect(rows[0].actorEmail).toBe('owner@example.com')
        expect(rows[3].actorEmail).toBeNull()
        expect(rows[4].actorEmail).toBeNull()
        expect(JSON.parse(rows[2].metadata)).toEqual({
            legacyActivityCode: '-2',
            message: 'Incorrect credential',
            migratedFrom: 'flowops_login_activity'
        })

        const indexes = (await dataSource.query(`PRAGMA index_list('flowops_audit_log')`)) as Array<{ name: string }>
        expect(indexes.map((index) => index.name)).toEqual(
            expect.arrayContaining([
                'IDX_flowops_audit_log_actorUserId',
                'IDX_flowops_audit_log_action',
                'IDX_flowops_audit_log_createdDate',
                'IDX_flowops_audit_log_organizationId'
            ])
        )
        await expect(dataSource.query(`SELECT COUNT(*) AS count FROM "flowops_login_activity"`)).resolves.toEqual([{ count: 5 }])

        await queryRunner.release()
    })

    it('drops only the new audit table on rollback', async () => {
        const queryRunner = dataSource.createQueryRunner()
        const migration = new AddFlowOpsAuditLog1779100000000()
        await migration.up(queryRunner)
        await migration.down(queryRunner)

        await expect(dataSource.query(`SELECT COUNT(*) AS count FROM "flowops_login_activity"`)).resolves.toEqual([{ count: 5 }])
        await expect(dataSource.query(`SELECT * FROM "flowops_audit_log"`)).rejects.toThrow('no such table')

        await queryRunner.release()
    })
})
