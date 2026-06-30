import { MigrationInterface, QueryRunner } from "typeorm";

export class FixApprovedByIndex1782849500000 implements MigrationInterface {
    name = 'FixApprovedByIndex1782849500000'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(
            `ALTER TABLE \`survey_submissions\` DROP FOREIGN KEY \`FK_288c989af22446b0a1ab282f5e5\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`survey_submissions\` DROP INDEX \`REL_288c989af22446b0a1ab282f5e\``,
        );
        await queryRunner.query(
            `ALTER TABLE \`survey_submissions\` ADD INDEX \`IDX_288c989af22446b0a1ab282f5e\` (\`approved_by_id\`)`,
        );
        await queryRunner.query(
            `ALTER TABLE \`survey_submissions\` ADD CONSTRAINT \`FK_288c989af22446b0a1ab282f5e5\` FOREIGN KEY (\`approved_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE SET NULL ON UPDATE NO ACTION`,
        );
    }

    public async down() {}
}
