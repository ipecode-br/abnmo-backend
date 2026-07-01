import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentkeyToSubmissions1782948034407 implements MigrationInterface {
    name = 'AddDocumentkeyToSubmissions1782948034407'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD \`document_key\` varchar(512) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` CHANGE \`status\` \`status\` enum ('pending_document', 'pending_review', 'rejected', 'approved', 'completed') NOT NULL DEFAULT 'pending_document'`);
    }

    public async down() {}

}
