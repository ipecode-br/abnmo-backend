import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateTokenIdToUuidType1779304764530 implements MigrationInterface {
    name = 'UpdateTokenIdToUuidType1779304764530'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`avatar_url\``);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`avatar_url\` varchar(2048) NULL`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`has_disability\` \`has_disability\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`need_legal_assistance\` \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`take_medication\` \`take_medication\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`tokens\` CHANGE \`id\` \`id\` int NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD \`id\` varchar(36) NOT NULL PRIMARY KEY`);
        await queryRunner.query(`ALTER TABLE \`tokens\` CHANGE \`expires_at\` \`expires_at\` datetime NULL`);
        await queryRunner.query(`CREATE INDEX \`IDX_d2d21b8a4232c0a5322be4d4c8\` ON \`tokens\` (\`entity_id\`)`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX \`IDX_d2d21b8a4232c0a5322be4d4c8\` ON \`tokens\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` CHANGE \`expires_at\` \`expires_at\` datetime(6) NULL DEFAULT CURRENT_TIMESTAMP(6)`);
        await queryRunner.query(`ALTER TABLE \`tokens\` DROP COLUMN \`id\``);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`tokens\` ADD PRIMARY KEY (\`id\`)`);
        await queryRunner.query(`ALTER TABLE \`tokens\` CHANGE \`id\` \`id\` int NOT NULL AUTO_INCREMENT`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`take_medication\` \`take_medication\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`need_legal_assistance\` \`need_legal_assistance\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`has_disability\` \`has_disability\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` DROP COLUMN \`avatar_url\``);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD \`avatar_url\` varchar(255) NULL`);
    }

}
