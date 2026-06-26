import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSupportContactsToUsers1782505458920 implements MigrationInterface {
    name = 'AddSupportContactsToUsers1782505458920'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`support_contacts\` json NULL`);
    }

    public async down() {}

}
