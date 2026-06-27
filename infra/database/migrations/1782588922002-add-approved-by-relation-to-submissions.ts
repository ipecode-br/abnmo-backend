import { MigrationInterface, QueryRunner } from "typeorm";

export class AddApprovedByRelationToSubmissions1782588922002 implements MigrationInterface {
    name = 'AddApprovedByRelationToSubmissions1782588922002'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` CHANGE \`approved_by\` \`approved_by_id\` varchar(255) NULL`);
        await queryRunner.query(`ALTER TABLE \`survey_submissions\` ADD CONSTRAINT \`FK_288c989af22446b0a1ab282f5e5\` FOREIGN KEY (\`approved_by_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down() {}

}
