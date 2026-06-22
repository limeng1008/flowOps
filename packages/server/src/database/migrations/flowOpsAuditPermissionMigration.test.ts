import { afterEach, beforeEach, describe, expect, it } from '@jest/globals'
import fs from 'fs'
import path from 'path'
import { DataSource } from '../../../node_modules/typeorm'
import {
    FLOWOPS_ADMIN_ROLE_PERMISSIONS,
    FLOWOPS_MEMBER_ROLE_PERMISSIONS,
    FLOWOPS_OWNER_ROLE_PERMISSIONS
} from './flowOpsIamRolePermissions'
import { GrantAuditLogsPermission1779200000000 } from './sqlite/1779200000000-GrantAuditLogsPermission'

describe('auditLogs:view role permission migration', () => {
    let dataSource: DataSource

    beforeEach(async () => {
        dataSource = new DataSource({ type: 'sqlite', database: ':memory:' })
        await dataSource.initialize()
        await dataSource.query(`
            CREATE TABLE flowops_role (
                id varchar PRIMARY KEY NOT NULL,
                name varchar NOT NULL,
                permissions text NOT NULL,
                isBuiltin boolean NOT NULL DEFAULT 0,
                updatedDate datetime
            )
        `)
        await dataSource.query(
            `INSERT INTO flowops_role (id, name, permissions, isBuiltin) VALUES
                ('owner', 'owner', '["chatflows:view"]', 1),
                ('admin', 'admin', '["users:manage","auditLogs:view"]', 1),
                ('member', 'member', '["chatflows:view"]', 1),
                ('custom-owner', 'owner-copy', '["chatflows:view"]', 1),
                ('non-builtin-owner', 'owner', '["chatflows:view"]', 0)`
        )
    })

    afterEach(async () => {
        if (dataSource.isInitialized) await dataSource.destroy()
    })

    it('seeds new owner/admin roles and registers all full and ship migrations', () => {
        expect(FLOWOPS_OWNER_ROLE_PERMISSIONS).toContain('auditLogs:view')
        expect(FLOWOPS_ADMIN_ROLE_PERMISSIONS).toContain('auditLogs:view')
        expect(FLOWOPS_MEMBER_ROLE_PERMISSIONS).not.toContain('auditLogs:view')

        for (const driver of ['postgres', 'mysql', 'mariadb', 'sqlite']) {
            const directory = path.resolve(__dirname, driver)
            const expectedImport = "import { GrantAuditLogsPermission1779200000000 } from './1779200000000-GrantAuditLogsPermission'"
            expect(fs.readFileSync(path.join(directory, 'index.ts'), 'utf8')).toContain(expectedImport)
            expect(fs.readFileSync(path.join(directory, 'index.ship.ts'), 'utf8')).toContain(expectedImport)
            expect(fs.existsSync(path.join(directory, '1779200000000-GrantAuditLogsPermission.ts'))).toBe(true)
        }
    })

    it('appends only auditLogs:view to builtin owner/admin and is idempotent', async () => {
        const migration = new GrantAuditLogsPermission1779200000000()
        const queryRunner = dataSource.createQueryRunner()

        await migration.up(queryRunner)
        await migration.up(queryRunner)

        const rows = (await dataSource.query('SELECT id, permissions FROM flowops_role ORDER BY id')) as Array<{
            id: string
            permissions: string
        }>
        const permissions = new Map(rows.map((row) => [row.id, JSON.parse(row.permissions) as string[]]))

        expect(permissions.get('owner')).toEqual(['chatflows:view', 'auditLogs:view'])
        expect(permissions.get('admin')).toEqual(['users:manage', 'auditLogs:view'])
        expect(permissions.get('member')).toEqual(['chatflows:view'])
        expect(permissions.get('custom-owner')).toEqual(['chatflows:view'])
        expect(permissions.get('non-builtin-owner')).toEqual(['chatflows:view'])

        await queryRunner.release()
    })

    it('down removes only auditLogs:view from builtin owner/admin', async () => {
        const migration = new GrantAuditLogsPermission1779200000000()
        const queryRunner = dataSource.createQueryRunner()

        await migration.up(queryRunner)
        await migration.down(queryRunner)

        const rows = (await dataSource.query(
            `SELECT id, permissions FROM flowops_role WHERE id IN ('owner', 'admin', 'member') ORDER BY id`
        )) as Array<{ id: string; permissions: string }>
        const permissions = new Map(rows.map((row) => [row.id, JSON.parse(row.permissions) as string[]]))

        expect(permissions.get('owner')).toEqual(['chatflows:view'])
        expect(permissions.get('admin')).toEqual(['users:manage'])
        expect(permissions.get('member')).toEqual(['chatflows:view'])

        await queryRunner.release()
    })
})
