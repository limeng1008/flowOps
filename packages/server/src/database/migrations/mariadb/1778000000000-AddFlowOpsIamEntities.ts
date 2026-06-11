import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowOpsIamEntities1778000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`flowops_user\` (
                \`id\` varchar(36) NOT NULL,
                \`email\` varchar(255) NOT NULL,
                \`name\` varchar(255),
                \`credential\` text,
                \`status\` varchar(20) NOT NULL DEFAULT 'invited',
                \`tempToken\` text,
                \`tokenExpiry\` datetime(6),
                \`lastLogin\` datetime(6),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_flowops_user_email\` (\`email\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`flowops_organization\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`ownerUserId\` text NOT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`flowops_workspace\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(255) NOT NULL,
                \`description\` text,
                \`organizationId\` text NOT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)
        await queryRunner.query(`CREATE INDEX \`IDX_flowops_workspace_organizationId\` ON \`flowops_workspace\` (\`organizationId\`(255));`)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`flowops_role\` (
                \`id\` varchar(36) NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` text,
                \`permissions\` text NOT NULL,
                \`isBuiltin\` tinyint(1) NOT NULL DEFAULT 0,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_flowops_role_name\` (\`name\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`flowops_workspace_member\` (
                \`id\` varchar(36) NOT NULL,
                \`workspaceId\` text NOT NULL,
                \`userId\` text NOT NULL,
                \`roleId\` text NOT NULL,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_flowops_workspace_member_workspace_user\` (\`workspaceId\`(255), \`userId\`(255)),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)
        await queryRunner.query(
            `CREATE INDEX \`IDX_flowops_workspace_member_workspaceId\` ON \`flowops_workspace_member\` (\`workspaceId\`(255));`
        )
        await queryRunner.query(`CREATE INDEX \`IDX_flowops_workspace_member_userId\` ON \`flowops_workspace_member\` (\`userId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_flowops_workspace_member_roleId\` ON \`flowops_workspace_member\` (\`roleId\`(255));`)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`flowops_login_activity\` (
                \`id\` varchar(36) NOT NULL,
                \`userId\` text,
                \`activityCode\` varchar(50) NOT NULL,
                \`ip\` varchar(100),
                \`message\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)
        await queryRunner.query(`CREATE INDEX \`IDX_flowops_login_activity_userId\` ON \`flowops_login_activity\` (\`userId\`(255));`)
        await queryRunner.query(
            `CREATE INDEX \`IDX_flowops_login_activity_activityCode\` ON \`flowops_login_activity\` (\`activityCode\`);`
        )

        await queryRunner.query(`
            INSERT IGNORE INTO \`flowops_role\` (\`id\`, \`name\`, \`description\`, \`permissions\`, \`isBuiltin\`, \`createdDate\`, \`updatedDate\`)
            VALUES
                ('00000000-0000-4000-8000-000000000001', 'owner', 'Built-in owner role', '[]', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
                ('00000000-0000-4000-8000-000000000002', 'admin', 'Built-in admin role', '[]', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6)),
                ('00000000-0000-4000-8000-000000000003', 'member', 'Built-in member role', '[]', 1, CURRENT_TIMESTAMP(6), CURRENT_TIMESTAMP(6));
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`flowops_login_activity\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`flowops_workspace_member\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`flowops_workspace\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`flowops_organization\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`flowops_role\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`flowops_user\``)
    }
}
