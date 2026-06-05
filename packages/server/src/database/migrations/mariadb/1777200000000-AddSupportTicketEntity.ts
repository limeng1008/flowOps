import { MigrationInterface, QueryRunner } from 'typeorm'

export class AddSupportTicketEntity1777200000000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            CREATE TABLE IF NOT EXISTS \`support_ticket\` (
                \`id\` varchar(36) NOT NULL,
                \`organizationId\` text NOT NULL,
                \`workspaceId\` text,
                \`requesterUserId\` text NOT NULL,
                \`requesterEmail\` varchar(255) NOT NULL,
                \`requesterName\` varchar(255),
                \`assignedToEmail\` varchar(255),
                \`subject\` varchar(200) NOT NULL,
                \`category\` varchar(50),
                \`status\` varchar(20) NOT NULL DEFAULT 'open',
                \`priority\` varchar(20) NOT NULL DEFAULT 'normal',
                \`messages\` text NOT NULL,
                \`lastMessage\` text,
                \`lastMessageBy\` varchar(20),
                \`resolvedDate\` datetime(6),
                \`closedDate\` datetime(6),
                \`createdDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6),
                \`updatedDate\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6),
                PRIMARY KEY (\`id\`)
            ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_520_ci;
        `)
        await queryRunner.query(`CREATE INDEX \`IDX_support_ticket_organizationId\` ON \`support_ticket\` (\`organizationId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_ticket_workspaceId\` ON \`support_ticket\` (\`workspaceId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_ticket_requesterUserId\` ON \`support_ticket\` (\`requesterUserId\`(255));`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_ticket_status\` ON \`support_ticket\` (\`status\`);`)
        await queryRunner.query(`CREATE INDEX \`IDX_support_ticket_priority\` ON \`support_ticket\` (\`priority\`);`)
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE IF EXISTS \`support_ticket\``)
    }
}
