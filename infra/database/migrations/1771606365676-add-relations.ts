import { MigrationInterface, QueryRunner } from "typeorm";

export class AddRelations1771606365676 implements MigrationInterface {
    name = 'AddRelations1771606365676'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD \`user_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`user_id\` varchar(255) NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`user_id\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP COLUMN \`user_id\``);
    }

}
