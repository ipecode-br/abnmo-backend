import { MigrationInterface, QueryRunner } from "typeorm";

export class RenameApprovedByToUpdatedBy1782853852589 implements MigrationInterface {
    name = 'RenameApprovedByToUpdatedBy1782853852589'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` DROP FOREIGN KEY \`FK_288c989af22446b0a1ab282f5e5\``);
        await queryRunner.query(`DROP INDEX \`IDX_288c989af22446b0a1ab282f5e\` ON \`survey_submissions\``);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` CHANGE \`approved_by_id\` \`updated_by_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD INDEX \`IDX_updated_by\` (\`updated_by_id\`)`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD CONSTRAINT \`FK_13ebe0dbb99955190e1aa7cd579\` FOREIGN KEY (\`updated_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`);
    }

    public async down() {}
}
