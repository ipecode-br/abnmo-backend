import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateSurveyTypes1783368249314 implements MigrationInterface {
    name = 'UpdateSurveyTypes1783368249314'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`surveys\` MODIFY \`crises_before_diagnosis\` int NULL`);
        await queryRunner.query(`ALTER TABLE \`surveys\` MODIFY \`crises_since_diagnosis\` int NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`surveys\` MODIFY \`crises_before_diagnosis\` tinyint NULL`);
        await queryRunner.query(`ALTER TABLE \`surveys\` MODIFY \`crises_since_diagnosis\` tinyint NULL`);
    }
}
