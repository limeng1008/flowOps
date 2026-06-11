import { MigrationInterface, QueryRunner } from 'typeorm'
import { FLOWOPS_BUILTIN_ROLE_PERMISSION_ROWS, toSqlStringLiteral } from '../flowOpsIamRolePermissions'

export class BackfillFlowOpsRolePermissions1778000100000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const [roleName, permissions] of FLOWOPS_BUILTIN_ROLE_PERMISSION_ROWS) {
            await queryRunner.query(`
                UPDATE flowops_role
                SET permissions = '${toSqlStringLiteral(permissions)}',
                    "updatedDate" = now()
                WHERE name = '${roleName}';
            `)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const [roleName] of FLOWOPS_BUILTIN_ROLE_PERMISSION_ROWS) {
            await queryRunner.query(`
                UPDATE flowops_role
                SET permissions = '[]',
                    "updatedDate" = now()
                WHERE name = '${roleName}';
            `)
        }
    }
}
