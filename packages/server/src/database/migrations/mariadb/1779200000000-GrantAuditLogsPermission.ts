import { MigrationInterface, QueryRunner } from 'typeorm'
import { updateBuiltinAuditLogPermission } from '../flowOpsAuditPermissionMigration'

export class GrantAuditLogsPermission1779200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await updateBuiltinAuditLogPermission(queryRunner, 'grant', '`')
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await updateBuiltinAuditLogPermission(queryRunner, 'revoke', '`')
    }
}
