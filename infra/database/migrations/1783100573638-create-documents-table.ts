import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateDocumentsTable1783100573638 implements MigrationInterface {
    name = 'CreateDocumentsTable1783100573638'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`documents\` (\`id\` varchar(36) NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`name\` varchar(128) NOT NULL, \`filename\` varchar(256) NOT NULL, \`key\` varchar(512) NOT NULL, \`url\` varchar(2048) NOT NULL, \`size\` int NOT NULL, \`mime_type\` varchar(64) NOT NULL, \`category\` enum ('avatar', 'medical_report') NOT NULL, \`status\` enum ('pending', 'confirmed') NOT NULL DEFAULT 'pending', \`user_id\` varchar(36) NULL, \`submission_id\` varchar(36) NULL, UNIQUE INDEX \`REL_535832888bafc36dc0f05c26ea\` (\`submission_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP COLUMN \`document_key\``);
        await queryRunner.query(`ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_c7481daf5059307842edef74d73\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`documents\` ADD CONSTRAINT \`FK_535832888bafc36dc0f05c26ea0\` FOREIGN KEY (\`submission_id\`) REFERENCES \`survey_submissions\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down() {}

}
