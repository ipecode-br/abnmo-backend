import { MigrationInterface, QueryRunner } from "typeorm";

export class RemoveUserIdAddSignatureId1782928876819 implements MigrationInterface {
    name = 'RemoveUserIdAddSignatureId1782928876819'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`surveys\` DROP FOREIGN KEY \`FK_3e312e00b31402a7e6093db119a\``);
        await queryRunner.query(`ALTER TABLE \`surveys\` MODIFY \`user_id\` varchar(36) NULL`);
      await queryRunner.query(`ALTER TABLE \`surveys\` ADD CONSTRAINT \`FK_3e312e00b31402a7e6093db119a\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
      await queryRunner.query(`ALTER TABLE \`surveys\` ADD \`signature_id\` varchar(64) NULL`);
    }

    public async down() { }
}
