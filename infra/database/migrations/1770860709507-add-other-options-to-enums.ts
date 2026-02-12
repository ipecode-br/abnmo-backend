import { MigrationInterface, QueryRunner } from "typeorm";

export class AddOtherOptionsToEnums1770860709507 implements MigrationInterface {
    name = 'AddOtherOptionsToEnums1770860709507'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`gender\` \`gender\` enum ('male_cis', 'female_cis', 'male_trans', 'female_trans', 'non_binary', 'prefer_not_to_say', 'other') NOT NULL DEFAULT 'prefer_not_to_say'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`race\` \`race\` enum ('white', 'black', 'yellow', 'mixed_race', 'indigenous', 'prefer_not_to_say', 'other') NOT NULL DEFAULT 'prefer_not_to_say'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`race\` \`race\` enum ('white', 'black', 'yellow', 'mixed_race', 'indigenous', 'prefer_not_to_say') NOT NULL DEFAULT 'prefer_not_to_say'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`gender\` \`gender\` enum ('male_cis', 'female_cis', 'male_trans', 'female_trans', 'non_binary', 'prefer_not_to_say') NOT NULL DEFAULT 'prefer_not_to_say'`);
    }

}
