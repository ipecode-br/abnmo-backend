import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateAppointmentsReferralsRelations1782700766923 implements MigrationInterface {
    name = 'UpdateAppointmentsReferralsRelations1782700766923'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP COLUMN \`user_id\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`user_id\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD \`specialist_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`specialist_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP FOREIGN KEY \`FK_bb61873c1c10fe8662f540f0625\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP COLUMN \`patient_id\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD \`patient_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_3330f054416745deaa2cc130700\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP COLUMN \`patient_id\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD \`patient_id\` varchar(36) NULL`);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD CONSTRAINT \`FK_bb61873c1c10fe8662f540f0625\` FOREIGN KEY (\`patient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD CONSTRAINT \`FK_b2903a020d2664c4fba0534ad71\` FOREIGN KEY (\`specialist_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_3330f054416745deaa2cc130700\` FOREIGN KEY (\`patient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_76e86d9052e7a6543535357426e\` FOREIGN KEY (\`specialist_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down() {}

}
