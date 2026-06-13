import { MigrationInterface, QueryRunner } from 'typeorm'
import { hasColumn } from '../../../utils/database.util'

const businessWorkspaceTables = [
    'apikey',
    'assistant',
    'chat_flow',
    'credential',
    'custom_template',
    'custom_mcp_server',
    'dataset',
    'document_store',
    'evaluation',
    'evaluator',
    'execution',
    'tool',
    'variable'
] as const

export class AddWorkspaceIdColumnsToBusinessTables1778000300000 implements MigrationInterface {
    public async up(queryRunner: QueryRunner): Promise<void> {
        for (const tableName of businessWorkspaceTables) {
            if (!(await queryRunner.hasTable(tableName)) || (await hasColumn(queryRunner, tableName, 'workspaceId'))) {
                continue
            }

            await queryRunner.query(`ALTER TABLE \`${tableName}\` ADD COLUMN \`workspaceId\` text`)
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        for (const tableName of businessWorkspaceTables) {
            if (!(await queryRunner.hasTable(tableName)) || !(await hasColumn(queryRunner, tableName, 'workspaceId'))) {
                continue
            }

            await queryRunner.query(`ALTER TABLE \`${tableName}\` DROP COLUMN \`workspaceId\``)
        }
    }
}
