import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddPaymentOrder1777100000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "payment_order" (
                "id" varchar PRIMARY KEY NOT NULL,
                "orderNo" varchar(64) NOT NULL,
                "organizationId" text NOT NULL,
                "planCode" varchar(50) NOT NULL,
                "provider" varchar(20) NOT NULL,
                "amountCents" integer NOT NULL,
                "currency" varchar(10) NOT NULL DEFAULT 'CNY',
                "status" varchar(20) NOT NULL DEFAULT 'pending',
                "thirdPartyTxnId" varchar(100),
                "paidAt" datetime,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_payment_order_orderNo" ON "payment_order" ("orderNo");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_payment_order_organizationId" ON "payment_order" ("organizationId");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "payment_order"`)
    }
}
