import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddBillingPlanEntitlementTier1779000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('billing_plan', 'entitlementTier')
        if (!hasColumn) {
            await queryRunner.query(`ALTER TABLE \`billing_plan\` ADD COLUMN \`entitlementTier\` varchar(32) NOT NULL DEFAULT 'free';`)
        }

        await queryRunner.query(`
            UPDATE \`billing_plan\`
            SET \`entitlementTier\` = CASE
                WHEN LOWER(\`code\`) LIKE 'local_dev%' THEN 'enterprise'
                WHEN LOWER(\`code\`) LIKE '%enterprise%' THEN 'enterprise'
                WHEN LOWER(\`code\`) LIKE '%team%' THEN 'team'
                WHEN LOWER(\`code\`) LIKE '%pro%' THEN 'pro'
                WHEN LOWER(\`code\`) LIKE '%free%' THEN 'free'
                ELSE \`entitlementTier\`
            END
            WHERE \`entitlementTier\` IS NULL OR \`entitlementTier\` = 'free';
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        const hasColumn = await queryRunner.hasColumn('billing_plan', 'entitlementTier')
        if (hasColumn) {
            await queryRunner.query(`ALTER TABLE \`billing_plan\` DROP COLUMN \`entitlementTier\`;`)
        }
    }
}
