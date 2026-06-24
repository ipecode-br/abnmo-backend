import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFeaturesToUser1782325100113 implements MigrationInterface {
    name = 'AddFeaturesToUser1782325100113'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`features\` json NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`has_disability\` \`has_disability\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`need_legal_assistance\` \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`take_medication\` \`take_medication\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`ALTER TABLE \`users\` DROP COLUMN \`email\``);
        await queryRunner.query(`ALTER TABLE \`users\` ADD \`email\` varchar(254) NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`users\` ADD UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`)`);
    }

    public async down(){}

}
