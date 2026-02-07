import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUser1770495283456 implements MigrationInterface {
    name = 'UpdateUser1770495283456'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`specialty\` enum ('medical_care', 'legal', 'nursing', 'psychology', 'nutrition', 'physical_training', 'social_work', 'psychiatry', 'neurology', 'ophthalmology') NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`registration_id\` varchar(32) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_345c3e629924f513952b2e9bf4\` (\`registration_id\`)`);
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`password\` varchar(64) NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`date_of_birth\` \`date_of_birth\` datetime NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`phone\` \`phone\` varchar(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`cpf\` \`cpf\` varchar(11) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`state\` \`state\` enum ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`city\` \`city\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`nmo_diagnosis\` \`nmo_diagnosis\` enum ('anti_aqp4_positive', 'anti_mog_positive', 'both_negative', 'no_diagnosis') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`password\` varchar(64) NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`password\` varchar(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`nmo_diagnosis\` \`nmo_diagnosis\` enum ('anti_aqp4_positive', 'anti_mog_positive', 'both_negative', 'no_diagnosis') NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`city\` \`city\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`state\` \`state\` enum ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO') NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`cpf\` \`cpf\` varchar(11) NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`phone\` \`phone\` varchar(11) NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`date_of_birth\` \`date_of_birth\` datetime NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`password\``);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`password\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` DROP INDEX \`IDX_345c3e629924f513952b2e9bf4\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`registration_id\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`specialty\``);
    }

}
