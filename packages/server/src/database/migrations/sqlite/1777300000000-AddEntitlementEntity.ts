import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddEntitlementEntity1777300000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "entitlement" (
                "id" varchar NOT NULL,
                "scopeId" text NOT NULL,
                "tier" varchar(32) NOT NULL DEFAULT 'free',
                "seats" integer NOT NULL DEFAULT 1,
                "creditsTotal" integer NOT NULL DEFAULT 0,
                "creditsBalance" integer NOT NULL DEFAULT 0,
                "features" text NOT NULL,
                "concurrency" integer NOT NULL DEFAULT 1,
                "expireAt" datetime,
                "source" varchar(32) NOT NULL DEFAULT 'local',
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY ("id")
            );
        `)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_entitlement_scopeId_unique" ON "entitlement" ("scopeId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_entitlement_tier" ON "entitlement" ("tier");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_entitlement_creditsBalance" ON "entitlement" ("creditsBalance");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_entitlement_source" ON "entitlement" ("source");`)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "entitlement_usage" (
                "id" varchar NOT NULL,
                "entitlementId" text NOT NULL,
                "scopeId" text NOT NULL,
                "idempotencyKey" varchar(255) NOT NULL,
                "action" varchar(64) NOT NULL,
                "credits" integer NOT NULL DEFAULT 0,
                "metadata" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                PRIMARY KEY ("id")
            );
        `)
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "IDX_entitlement_usage_scope_idempotency_unique" ON "entitlement_usage" ("scopeId", "idempotencyKey");`
        )
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_entitlement_usage_entitlementId" ON "entitlement_usage" ("entitlementId");`
        )
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_entitlement_usage_action" ON "entitlement_usage" ("action");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "entitlement_usage"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "entitlement"`)
    }
}
