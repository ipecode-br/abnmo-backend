import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceRejecteWithDeclined1783273396115 implements MigrationInterface {
    name = 'ReplaceRejecteWithDeclined1783273396115'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD \`reason\` varchar(500) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` CHANGE \`status\` \`status\` enum ('pending_document', 'pending_review', 'declined', 'approved', 'completed') NOT NULL DEFAULT 'pending_document'`);
    }

    public async down() {}

}
