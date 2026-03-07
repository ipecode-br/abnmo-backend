import { MigrationInterface, QueryRunner } from "typeorm";

export class CamelCase1772848950500 implements MigrationInterface {
    name = 'CamelCase1772848950500'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`has_disability\` \`has_disability\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`need_legal_assistance\` \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`take_medication\` \`take_medication\` tinyint(1) NOT NULL DEFAULT '0'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`take_medication\` \`take_medication\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`need_legal_assistance\` \`need_legal_assistance\` tinyint NOT NULL DEFAULT '0'`);
        await queryRunner.query(`ALTER TABLE \`patients\` CHANGE \`has_disability\` \`has_disability\` tinyint NOT NULL DEFAULT '0'`);
    }

}
