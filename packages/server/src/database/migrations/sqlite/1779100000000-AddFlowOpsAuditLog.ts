import { MigrationInterface, QueryRunner } from 'typeorm'
import { migrateLegacyLoginActivities } from '../flowOpsAuditLogMigration'

export class AddFlowOpsAuditLog1779100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_audit_log" (
                "id" varchar PRIMARY KEY NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "actorUserId" varchar(255),
                "actorEmail" varchar(255),
                "action" varchar(100) NOT NULL,
                "targetType" varchar(100) NOT NULL,
                "targetId" varchar(255),
                "targetName" text,
                "organizationId" varchar(255),
                "workspaceId" varchar(255),
                "status" varchar(20) NOT NULL,
                "ip" varchar(100),
                "userAgent" text,
                "metadata" text NOT NULL DEFAULT '{}'
            );
        `)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_flowops_audit_log_actorUserId" ON "flowops_audit_log" ("actorUserId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_flowops_audit_log_action" ON "flowops_audit_log" ("action");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_flowops_audit_log_createdDate" ON "flowops_audit_log" ("createdDate");`)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_flowops_audit_log_organizationId" ON "flowops_audit_log" ("organizationId");`
        )
        await migrateLegacyLoginActivities(queryRunner, '"')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_audit_log"`)
    }
}
