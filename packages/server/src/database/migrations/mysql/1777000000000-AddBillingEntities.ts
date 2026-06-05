import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBillingEntities1777000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`billing_plan\` (
                \`id\` varchar(36) NOT NULL,
                \`code\` varchar(50) NOT NULL,
                \`name\` varchar(100) NOT NULL,
                \`description\` text,
                \`quotas\` text NOT NULL,
                \`monthlyPriceCents\` int NOT NULL DEFAULT 0,
                \`currency\` varchar(10) NOT NULL DEFAULT 'CNY',
                \`isActive\` tinyint(1) DEFAULT 1,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`UQ_billing_plan_code\` (\`code\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`billing_subscription\` (
                \`id\` varchar(36) NOT NULL,
                \`organizationId\` text NOT NULL,
                \`planId\` text NOT NULL,
                \`status\` varchar(20) NOT NULL DEFAULT 'active',
                \`currentPeriodStart\` datetime(6),
                \`currentPeriodEnd\` datetime(6),
                \`quotaOverrides\` text,
                \`notes\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `)
        await queryRunner.query(
            `CREATE INDEX \`IDX_billing_subscription_organizationId\` ON \`billing_subscription\` (\`organizationId\`(255));`
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`billing_usage\` (
                \`id\` varchar(36) NOT NULL,
                \`organizationId\` text NOT NULL,
                \`workspaceId\` text,
                \`chatflowId\` text,
                \`source\` varchar(30) NOT NULL,
                \`sourceId\` text,
                \`dedupeKey\` varchar(255) NOT NULL,
                \`period\` varchar(7) NOT NULL,
                \`inputTokens\` int NOT NULL DEFAULT 0,
                \`outputTokens\` int NOT NULL DEFAULT 0,
                \`totalTokens\` int NOT NULL DEFAULT 0,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_billing_usage_dedupeKey\` (\`dedupeKey\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `)
        await queryRunner.query(`CREATE INDEX \`IDX_billing_usage_organizationId\` ON \`billing_usage\` (\`organizationId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_billing_usage_period\` ON \`billing_usage\` (\`period\`);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`billing_usage\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`billing_subscription\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`billing_plan\``)
    }
}
