import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBillingEntities1777000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS billing_plan (
                id varchar(36) NOT NULL DEFAULT (uuid_generate_v4()::varchar),
                code varchar(50) NOT NULL,
                name varchar(100) NOT NULL,
                description text,
                quotas text NOT NULL,
                "monthlyPriceCents" integer NOT NULL DEFAULT 0,
                currency varchar(10) NOT NULL DEFAULT 'CNY',
                "isActive" boolean DEFAULT true,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_billing_plan" PRIMARY KEY (id),
                CONSTRAINT "UQ_billing_plan_code" UNIQUE (code)
            );
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS billing_subscription (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" text NOT NULL,
                "planId" text NOT NULL,
                status varchar(20) NOT NULL DEFAULT 'active',
                "currentPeriodStart" timestamp,
                "currentPeriodEnd" timestamp,
                "quotaOverrides" text,
                notes text,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_billing_subscription" PRIMARY KEY (id)
            );
        `)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_billing_subscription_organizationId" ON billing_subscription ("organizationId");`
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS billing_usage (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" text NOT NULL,
                "workspaceId" text,
                "chatflowId" text,
                source varchar(30) NOT NULL,
                "sourceId" text,
                "dedupeKey" varchar(255) NOT NULL,
                period varchar(7) NOT NULL,
                "inputTokens" integer NOT NULL DEFAULT 0,
                "outputTokens" integer NOT NULL DEFAULT 0,
                "totalTokens" integer NOT NULL DEFAULT 0,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_billing_usage" PRIMARY KEY (id)
            );
        `)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_billing_usage_organizationId" ON billing_usage ("organizationId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_billing_usage_period" ON billing_usage (period);`)
        await queryRunner.query(`CREATE UNIQUE INDEX IF NOT EXISTS "IDX_billing_usage_dedupeKey" ON billing_usage ("dedupeKey");`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS billing_usage`)
        await queryRunner.query(`DROP TABLE IF EXISTS billing_subscription`)
        await queryRunner.query(`DROP TABLE IF EXISTS billing_plan`)
    }
}
