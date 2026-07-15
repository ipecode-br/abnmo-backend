import { MigrationInterface, QueryRunner } from "typeorm";

export class AddSurveyTokenColumn1784063536652 implements MigrationInterface {
    name = 'AddSurveyTokenColumn1784063536652'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD \`survey_token\` varchar(36) NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_9d904bf2b6f4eab195f3f98973\` ON \`survey_submissions\` (\`survey_token\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_9d904bf2b6f4eab195f3f98973\` ON \`survey_submissions\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP COLUMN \`survey_token\``);
    }

}
