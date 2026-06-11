import { MigrationInterface, QueryRunner } from 'typeorm'

export class DecoupleWorkspaceFkFromBusinessTables1778000200000 implements MigrationInterface {
    public async up(_queryRunner: QueryRunner): Promise<void> {
        // SQLite never had these late-added workspace foreign keys, so there is nothing to drop.
    }

    public async down(_queryRunner: QueryRunner): Promise<void> {
        // SQLite never had these late-added workspace foreign keys, so there is nothing to recreate.
    }
}
