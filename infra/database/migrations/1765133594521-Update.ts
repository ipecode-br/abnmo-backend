import { MigrationInterface, QueryRunner } from "typeorm";

export class Update1765133594521 implements MigrationInterface {
    name = 'Update1765133594521'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP COLUMN \`date\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD \`date\` timestamp NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP COLUMN \`date\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD \`date\` date NOT NULL`);
    }

}
