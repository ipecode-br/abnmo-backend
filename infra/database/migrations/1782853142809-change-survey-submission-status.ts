import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeSurveySubmissionStatus1782853142809 implements MigrationInterface {
    name = 'ChangeSurveySubmissionStatus1782853142809'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` CHANGE \`status\` \`status\` enum ('pending', 'rejected', 'approved', 'completed') NOT NULL DEFAULT 'pending'`);
    }

    public async down() {}

}
