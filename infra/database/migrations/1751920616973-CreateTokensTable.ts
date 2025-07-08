import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateTokensTable1751920616973 implements MigrationInterface {
    name = 'CreateTokensTable1751920616973'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`type\` enum ('access_token', 'password_reset', 'refresh_token') NOT NULL, \`expires_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE \`tokens\``);
    }

}
