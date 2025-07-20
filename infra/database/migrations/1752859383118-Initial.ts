import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1752859383118 implements MigrationInterface {
    name = 'Initial1752859383118'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'nurse', 'specialist', 'manager', 'patient') NOT NULL DEFAULT 'patient', \`avatar_url\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patient_support\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`phone\` char(11) NOT NULL, \`kinship\` varchar(50) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patients\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`gender\` enum ('male_cis', 'female_cis', 'male_trans', 'female_trans', 'non_binary', 'prefer_not_to_say') NOT NULL, \`date_of_birth\` date NOT NULL, \`phone\` char(11) NOT NULL, \`cpf\` char(11) NOT NULL, \`state\` char(2) NOT NULL, \`city\` varchar(50) NOT NULL, \`has_disability\` tinyint(1) NOT NULL DEFAULT '0', \`disability_desc\` varchar(500) NULL, \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0', \`take_medication\` tinyint(1) NOT NULL DEFAULT '0', \`medication_desc\` varchar(500) NULL, \`has_nmo_diagnosis\` tinyint(1) NOT NULL DEFAULT '0', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_7fe1518dc780fd777669b5cb7a\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` varchar(255) NOT NULL, \`token\` varchar(255) NOT NULL, \`type\` enum ('access_token', 'password_reset') NOT NULL, \`expires_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`patient_support\` ADD CONSTRAINT \`FK_4ceff56b869f76ef08549d21bc7\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD CONSTRAINT \`FK_7fe1518dc780fd777669b5cb7a0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`patients\` DROP FOREIGN KEY \`FK_7fe1518dc780fd777669b5cb7a0\``);
        await queryRunner.query(`ALTER TABLE \`patient_support\` DROP FOREIGN KEY \`FK_4ceff56b869f76ef08549d21bc7\``);
        await queryRunner.query(`DROP TABLE \`tokens\``);
        await queryRunner.query(`DROP INDEX \`REL_7fe1518dc780fd777669b5cb7a\` ON \`patients\``);
        await queryRunner.query(`DROP TABLE \`patients\``);
        await queryRunner.query(`DROP TABLE \`patient_support\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
