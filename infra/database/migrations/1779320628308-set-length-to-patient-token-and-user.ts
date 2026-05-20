import { MigrationInterface, QueryRunner } from "typeorm";

export class SetLengthToPatientTokenAndUser1779320628308 implements MigrationInterface {
    name = 'SetLengthToPatientTokenAndUser1779320628308'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`avatar_url\``);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`avatar_url\` varchar(2048) NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`city\``);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`city\` varchar(64) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`has_disability\` \`has_disability\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`need_legal_assistance\` \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`take_medication\` \`take_medication\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD \`email\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`avatar_url\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`avatar_url\` varchar(2048) NULL`);
    }

    public async down() {
    }

}
