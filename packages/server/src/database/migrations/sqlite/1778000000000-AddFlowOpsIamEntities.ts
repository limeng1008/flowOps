import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddFlowOpsIamEntities1778000000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_user" (
                "id" varchar PRIMARY KEY NOT NULL,
                "email" varchar(255) NOT NULL,
                "name" varchar(255),
                "credential" text,
                "status" varchar(20) NOT NULL DEFAULT 'invited',
                "tempToken" text,
                "tokenExpiry" datetime,
                "lastLogin" datetime,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_flowops_user_email" UNIQUE ("email")
            );
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_organization" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar(255) NOT NULL,
                "ownerUserId" text NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_workspace" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar(255) NOT NULL,
                "description" text,
                "organizationId" text NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_flowops_workspace_organizationId" ON "flowops_workspace" ("organizationId");`
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_role" (
                "id" varchar PRIMARY KEY NOT NULL,
                "name" varchar(100) NOT NULL,
                "description" text,
                "permissions" text NOT NULL,
                "isBuiltin" boolean NOT NULL DEFAULT 0,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now')),
                CONSTRAINT "UQ_flowops_role_name" UNIQUE ("name")
            );
        `)

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_workspace_member" (
                "id" varchar PRIMARY KEY NOT NULL,
                "workspaceId" text NOT NULL,
                "userId" text NOT NULL,
                "roleId" text NOT NULL,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_flowops_workspace_member_workspaceId" ON "flowops_workspace_member" ("workspaceId");`
        )
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_flowops_workspace_member_userId" ON "flowops_workspace_member" ("userId");`
        )
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_flowops_workspace_member_roleId" ON "flowops_workspace_member" ("roleId");`
        )
        await queryRunner.query(
            `CREATE UNIQUE INDEX IF NOT EXISTS "UQ_flowops_workspace_member_workspace_user" ON "flowops_workspace_member" ("workspaceId", "userId");`
        )

        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS "flowops_login_activity" (
                "id" varchar PRIMARY KEY NOT NULL,
                "userId" text,
                "activityCode" varchar(50) NOT NULL,
                "ip" varchar(100),
                "message" text,
                "createdDate" datetime NOT NULL DEFAULT (datetime('now')),
                "updatedDate" datetime NOT NULL DEFAULT (datetime('now'))
            );
        `)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_flowops_login_activity_userId" ON "flowops_login_activity" ("userId");`)
        await queryRunner.query(
            `CREATE INDEX IF NOT EXISTS "IDX_flowops_login_activity_activityCode" ON "flowops_login_activity" ("activityCode");`
        )

        await queryRunner.query(`
            INSERT OR IGNORE INTO "flowops_role" ("id", "name", "description", "permissions", "isBuiltin", "createdDate", "updatedDate")
            VALUES
                ('00000000-0000-4000-8000-000000000001', 'owner', 'Built-in owner role', '[]', 1, datetime('now'), datetime('now')),
                ('00000000-0000-4000-8000-000000000002', 'admin', 'Built-in admin role', '[]', 1, datetime('now'), datetime('now')),
                ('00000000-0000-4000-8000-000000000003', 'member', 'Built-in member role', '[]', 1, datetime('now'), datetime('now'));
        `)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_login_activity"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_workspace_member"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_workspace"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_organization"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_role"`)
        await queryRunner.query(`DROP TABLE IF EXISTS "flowops_user"`)
    }
}
