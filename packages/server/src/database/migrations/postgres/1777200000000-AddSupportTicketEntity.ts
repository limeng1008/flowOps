import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportTicketEntity1777200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS support_ticket (
                id uuid NOT NULL DEFAULT uuid_generate_v4(),
                "organizationId" text NOT NULL,
                "workspaceId" text,
                "requesterUserId" text NOT NULL,
                "requesterEmail" varchar(255) NOT NULL,
                "requesterName" varchar(255),
                "assignedToEmail" varchar(255),
                subject varchar(200) NOT NULL,
                category varchar(50),
                status varchar(20) NOT NULL DEFAULT 'open',
                priority varchar(20) NOT NULL DEFAULT 'normal',
                messages text NOT NULL,
                "lastMessage" text,
                "lastMessageBy" varchar(20),
                "resolvedDate" timestamp,
                "closedDate" timestamp,
                "createdDate" timestamp NOT NULL DEFAULT now(),
                "updatedDate" timestamp NOT NULL DEFAULT now(),
                CONSTRAINT "PK_support_ticket" PRIMARY KEY (id)
            );
        `)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_organizationId" ON support_ticket ("organizationId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_workspaceId" ON support_ticket ("workspaceId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_requesterUserId" ON support_ticket ("requesterUserId");`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_status" ON support_ticket (status);`)
        await queryRunner.query(`CREATE INDEX IF NOT EXISTS "IDX_support_ticket_priority" ON support_ticket (priority);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS support_ticket`)
    }
}
