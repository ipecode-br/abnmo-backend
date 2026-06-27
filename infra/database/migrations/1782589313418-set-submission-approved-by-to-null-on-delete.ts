import { MigrationInterface, QueryRunner } from "typeorm";

export class SetSubmissionApprovedByToNullOnDelete1782589313418 implements MigrationInterface {
    name = 'SetSubmissionApprovedByToNullOnDelete1782589313418'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP FOREIGN KEY \`FK_288c989af22446b0a1ab282f5e5\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD CONSTRAINT \`FK_288c989af22446b0a1ab282f5e5\` FOREIGN KEY (\`approved_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down(){}

}
