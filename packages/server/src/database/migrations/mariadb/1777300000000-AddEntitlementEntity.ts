import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEntitlementEntity1777300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`entitlement\` (
                \`id\` varchar(36) NOT NULL,
                \`scopeId\` text NOT NULL,
                \`tier\` varchar(32) NOT NULL DEFAULT 'free',
                \`seats\` int NOT NULL DEFAULT 1,
                \`creditsTotal\` int NOT NULL DEFAULT 0,
                \`creditsBalance\` int NOT NULL DEFAULT 0,
                \`features\` text NOT NULL,
                \`concurrency\` int NOT NULL DEFAULT 1,
                \`expireAt\` datetime(6),
                \`source\` varchar(32) NOT NULL DEFAULT 'local',
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)
        await queryRunner.query(`CREATE UNIQUE INDEX \`IDX_entitlement_scopeId_unique\` ON \`entitlement\` (\`scopeId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_entitlement_tier\` ON \`entitlement\` (\`tier\`);`)
        await queryRunner.query(`CREATE INDEX \`IDX_entitlement_creditsBalance\` ON \`entitlement\` (\`creditsBalance\`);`)
        await queryRunner.query(`CREATE INDEX \`IDX_entitlement_source\` ON \`entitlement\` (\`source\`);`)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`entitlement_usage\` (
                \`id\` varchar(36) NOT NULL,
                \`entitlementId\` text NOT NULL,
                \`scopeId\` text NOT NULL,
                \`idempotencyKey\` varchar(255) NOT NULL,
                \`action\` varchar(64) NOT NULL,
                \`credits\` int NOT NULL DEFAULT 0,
                \`metadata\` text,
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)
        await queryRunner.query(
            `CREATE UNIQUE INDEX \`IDX_entitlement_usage_scope_idempotency_unique\` ON \`entitlement_usage\` (\`scopeId\`(255), \`idempotencyKey\`);`
        )
        await queryRunner.query(`CREATE INDEX \`IDX_entitlement_usage_entitlementId\` ON \`entitlement_usage\` (\`entitlementId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_entitlement_usage_action\` ON \`entitlement_usage\` (\`action\`);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`entitlement_usage\``)
        await queryRunner.query(`DROP TABLE IF EXISTS \`entitlement\``)
    }
}
