import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSessionsTable1782868298853 implements MigrationInterface {
    name = 'CreateSessionsTable1782868298853'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`sessions\` (\`id\` varchar(36) NOT NULL, \`updated_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), \`created_at\` datetime(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`token_hash\` varchar(64) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`expires_at\` datetime NOT NULL, INDEX \`IDX_085d540d9f418cfbdc7bd55bb1\` (\`user_id\`), UNIQUE INDEX \`IDX_abaa9e068cdd390bc5210f7988\` (\`token_hash\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`tokens\` CHANGE \`type\` \`type\` enum ('password_reset', 'invite_user') NOT NULL`);
        await queryRunner.query(`ALTER TABLE \`sessions\` ADD CONSTRAINT \`FK_085d540d9f418cfbdc7bd55bb19\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE CASCADE ON UPDATE NO ACTION`);
    }

    public async down() {}
}
