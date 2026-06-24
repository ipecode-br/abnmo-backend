import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateUserRoles1782334005023 implements MigrationInterface {
    name = 'UpdateUserRoles1782334005023'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`users\` CHANGE \`role\` \`role\` enum ('admin', 'member', 'specialist', 'patient') NOT NULL`);
    }

    public async down() {}

}
