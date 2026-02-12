import { MigrationInterface, QueryRunner } from "typeorm";

export class AddPatientRaces1770860465740 implements MigrationInterface {
    name = 'AddPatientRaces1770860465740'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`race\` enum ('white', 'black', 'yellow', 'mixed_race', 'indigenous', 'prefer_not_to_say') NOT NULL DEFAULT 'prefer_not_to_say'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`race\``);
    }

}
