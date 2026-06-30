import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveNameEmailPhoneFromSubmissions1782847628565 implements MigrationInterface {
    name = 'RemoveNameEmailPhoneFromSubmissions1782847628565'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_a80027edfa652ca3328b12e228\` ON \`survey_submissions\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP COLUMN \`name\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP COLUMN \`phone\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD \`user_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD UNIQUE INDEX \`IDX_ee799ccd89589e2731b5a59acc\` (\`user_id\`)`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`phone\` varchar(11) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP FOREIGN KEY \`FK_288c989af22446b0a1ab282f5e5\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP COLUMN \`approved_by_id\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD \`approved_by_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD UNIQUE INDEX \`IDX_288c989af22446b0a1ab282f5e\` (\`approved_by_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_ee799ccd89589e2731b5a59acc\` ON \`survey_submissions\` (\`user_id\`)`);
        await queryRunner.query(`CREATE UNIQUE INDEX \`REL_288c989af22446b0a1ab282f5e\` ON \`survey_submissions\` (\`approved_by_id\`)`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD CONSTRAINT \`FK_ee799ccd89589e2731b5a59acc4\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD CONSTRAINT \`FK_288c989af22446b0a1ab282f5e5\` FOREIGN KEY (\`approved_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down() {}

}
