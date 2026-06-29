import { MigrationInterface, QueryRunner } from "typeorm";

export class RemovePatientsTable1782692944491 implements MigrationInterface {
    name = 'RemovePatientsTable1782692944491'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_3330f054416745deaa2cc130700\``);
        await queryRunner.query(`ALTER TABLE \`patient_requirements\` DROP FOREIGN KEY \`FK_77b87c61cff4793ae6a4ac50070\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP FOREIGN KEY \`FK_bb61873c1c10fe8662f540f0625\``);
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`status\` \`status\` enum ('active', 'inactive', 'pending') NOT NULL DEFAULT 'active'`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_3330f054416745deaa2cc130700\` FOREIGN KEY (\`patient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`patient_requirements\` ADD CONSTRAINT \`FK_77b87c61cff4793ae6a4ac50070\` FOREIGN KEY (\`patient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD CONSTRAINT \`FK_bb61873c1c10fe8662f540f0625\` FOREIGN KEY (\`patient_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down() {}

}
