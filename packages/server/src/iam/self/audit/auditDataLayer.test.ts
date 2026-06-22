import fs from 'fs'
import path from 'path'

const entityPath = path.resolve(__dirname, '../entities/FlowOpsAuditLog.ts')
const entityBarrelPath = path.resolve(__dirname, '../entities/index.ts')
const serverEntityCatalogPath = path.resolve(__dirname, '../../../database/entities/index.ts')
const srcRoot = path.resolve(__dirname, '../../..')
const auditMigrationTimestamp = '1779100000000'
const auditMigrationClass = 'AddFlowOpsAuditLog1779100000000'

const read = (file: string) => fs.readFileSync(file, 'utf8')

describe('FlowOps audit data layer', () => {
    it('defines the audit entity fields and required indexes', () => {
        const source = read(entityPath)

        expect(source).toContain("@Entity('flowops_audit_log')")
        expect(source).toContain('export class FlowOpsAuditLog')
        expect(source).toContain("@PrimaryGeneratedColumn('uuid')")
        expect(source).toContain('@CreateDateColumn({ type: Date })')

        for (const field of [
            'actorUserId',
            'actorEmail',
            'action',
            'targetType',
            'targetId',
            'targetName',
            'organizationId',
            'workspaceId',
            'status',
            'ip',
            'userAgent',
            'metadata'
        ]) {
            expect(source).toContain(field)
        }

        for (const indexedField of ['actorUserId', 'action', 'createdDate', 'organizationId']) {
            expect(source).toMatch(new RegExp(`@Index\\(\\)\\s+@[A-Za-z]*Column\\([^)]*\\)\\s+${indexedField}`))
        }
    })

    it('registers FlowOpsAuditLog in the self barrel and server entity catalog', () => {
        expect(read(entityBarrelPath)).toContain("export { FlowOpsAuditLog } from './FlowOpsAuditLog'")

        const catalog = read(serverEntityCatalogPath)
        expect(catalog).toContain('FlowOpsAuditLog')
        expect(catalog).toContain("from '../../iam/self/entities'")
    })

    it('registers audit migrations in all full and ship migration sets without dropping legacy login activity', () => {
        for (const driver of ['postgres', 'mysql', 'mariadb', 'sqlite']) {
            const migration = read(path.join(srcRoot, `database/migrations/${driver}/${auditMigrationTimestamp}-AddFlowOpsAuditLog.ts`))
            const index = read(path.join(srcRoot, `database/migrations/${driver}/index.ts`))
            const shipIndex = read(path.join(srcRoot, `database/migrations/${driver}/index.ship.ts`))
            const expectedImport = `import { ${auditMigrationClass} } from './${auditMigrationTimestamp}-AddFlowOpsAuditLog'`

            expect(migration).toContain('flowops_audit_log')
            expect(migration).toContain('IDX_flowops_audit_log_actorUserId')
            expect(migration).toContain('IDX_flowops_audit_log_action')
            expect(migration).toContain('IDX_flowops_audit_log_createdDate')
            expect(migration).toContain('IDX_flowops_audit_log_organizationId')
            expect(migration).toContain('migrateLegacyLoginActivities')
            expect(migration).not.toMatch(/DROP TABLE[^\n]+flowops_login_activity/i)
            expect(index).toContain(expectedImport)
            expect(index).toContain(auditMigrationClass)
            expect(shipIndex).toContain(expectedImport)
            expect(shipIndex).toContain(auditMigrationClass)
        }
    })
})
