import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPaymentP0Hardening1777300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`payment_order\` ADD COLUMN \`expireAt\` timestamp NULL;`)
        await queryRunner.query(`CREATE INDEX \`IDX_payment_order_status_expireAt\` ON \`payment_order\` (\`status\`, \`expireAt\`);`)
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`payment_notification_log\` (
                \`id\` varchar(36) NOT NULL,
                \`orderNo\` varchar(64) NULL,
                \`provider\` varchar(20) NOT NULL,
                \`verified\` tinyint NOT NULL DEFAULT 0,
                \`rawBody\` longtext NOT NULL,
                \`headersDigest\` varchar(128) NOT NULL,
                \`errorMessage\` text NULL,
                \`createdDate\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            );
        `)
        await queryRunner.query(`CREATE INDEX \`IDX_payment_notification_log_orderNo\` ON \`payment_notification_log\` (\`orderNo\`);`)
        await queryRunner.query(`CREATE INDEX \`IDX_payment_notification_log_provider\` ON \`payment_notification_log\` (\`provider\`);`)
        await queryRunner.query(
            `CREATE INDEX \`IDX_payment_notification_log_createdDate\` ON \`payment_notification_log\` (\`createdDate\`);`
        )
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_payment_notification_log_createdDate\` ON \`payment_notification_log\`;`)
        await queryRunner.query(`DROP INDEX \`IDX_payment_notification_log_provider\` ON \`payment_notification_log\`;`)
        await queryRunner.query(`DROP INDEX \`IDX_payment_notification_log_orderNo\` ON \`payment_notification_log\`;`)
        await queryRunner.query(`DROP TABLE IF EXISTS \`payment_notification_log\`;`)
        await queryRunner.query(`DROP INDEX \`IDX_payment_order_status_expireAt\` ON \`payment_order\`;`)
        await queryRunner.query(`ALTER TABLE \`payment_order\` DROP COLUMN \`expireAt\`;`)
    }
}
