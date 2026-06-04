import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPaymentOrder1777100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`payment_order\` (
                \`id\` varchar(36) NOT NULL,
                \`orderNo\` varchar(64) NOT NULL,
                \`organizationId\` text NOT NULL,
                \`planCode\` varchar(50) NOT NULL,
                \`provider\` varchar(20) NOT NULL,
                \`amountCents\` int NOT NULL,
                \`currency\` varchar(10) NOT NULL DEFAULT 'CNY',
                \`status\` varchar(20) NOT NULL DEFAULT 'pending',
                \`thirdPartyTxnId\` varchar(100),
                \`paidAt\` datetime(6),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                UNIQUE INDEX \`IDX_payment_order_orderNo\` (\`orderNo\`),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_0900_ai_ci;
        `)
        await queryRunner.query(`CREATE INDEX \`IDX_payment_order_organizationId\` ON \`payment_order\` (\`organizationId\`(255));`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`payment_order\``)
    }
}
