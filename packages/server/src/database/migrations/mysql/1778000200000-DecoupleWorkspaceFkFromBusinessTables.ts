import { MigrationInterface, QueryRunner } from 'typeorm'

const businessWorkspaceForeignKeys = [
    ['apikey', 'fk_apikey_workspaceId'],
    ['assistant', 'fk_assistant_workspaceId'],
    ['chat_flow', 'fk_chat_flow_workspaceId'],
    ['credential', 'fk_credential_workspaceId'],
    ['custom_template', 'fk_custom_template_workspaceId'],
    ['dataset', 'fk_dataset_workspaceId'],
    ['document_store', 'fk_document_store_workspaceId'],
    ['evaluation', 'fk_evaluation_workspaceId'],
    ['evaluator', 'fk_evaluator_workspaceId'],
    ['execution', 'fk_execution_workspaceId'],
    ['tool', 'fk_tool_workspaceId'],
    ['variable', 'fk_variable_workspaceId']
] as const

export class DecoupleWorkspaceFkFromBusinessTables1778000200000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const [tableName, constraintName] of businessWorkspaceForeignKeys) {
            if (await this.constraintExists(queryRunner, tableName, constraintName)) {
                await queryRunner.query(`ALTER TABLE \`${tableName}\` DROP FOREIGN KEY \`${constraintName}\``)
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        if (!(await this.tableExists(queryRunner, 'workspace'))) return

        for (const [tableName, constraintName] of businessWorkspaceForeignKeys) {
            if (
                !(await this.tableExists(queryRunner, tableName)) ||
                (await this.constraintExists(queryRunner, tableName, constraintName))
            ) {
                continue
            }
            await queryRunner.query(
                `ALTER TABLE \`${tableName}\` ADD CONSTRAINT \`${constraintName}\` FOREIGN KEY (\`workspaceId\`) REFERENCES \`workspace\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`
            )
        }
    }

    private async tableExists(queryRunner: QueryRunner, tableName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT TABLE_NAME FROM information_schema.TABLES WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? LIMIT 1`,
            [tableName]
        )
        return rows.length > 0
    }

    private async constraintExists(queryRunner: QueryRunner, tableName: string, constraintName: string): Promise<boolean> {
        const rows = await queryRunner.query(
            `SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS WHERE TABLE_SCHEMA = DATABASE() AND TABLE_NAME = ? AND CONSTRAINT_NAME = ? AND CONSTRAINT_TYPE = 'FOREIGN KEY' LIMIT 1`,
            [tableName, constraintName]
        )
        return rows.length > 0
    }
}
