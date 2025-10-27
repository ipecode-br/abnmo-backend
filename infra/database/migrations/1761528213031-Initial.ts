import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1761528213031 implements MigrationInterface {
    name = 'Initial1761528213031'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'nurse', 'specialist', 'manager', 'patient') NOT NULL DEFAULT 'patient', \`avatar_url\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patients-requirement\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`type\` enum ('document', 'form') NOT NULL DEFAULT 'document', \`title\` varchar(255) NOT NULL, \`description\` varchar(500) NOT NULL, \`status\` enum ('pending', 'under_review', 'approved', 'declined') NOT NULL DEFAULT 'pending', \`required_by\` varchar(255) NOT NULL, \`approved_by\` varchar(255) NULL, \`approved_at\` timestamp NULL, \`submitted_at\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patient_supports\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`phone\` char(11) NOT NULL, \`kinship\` varchar(50) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patients\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`gender\` enum ('male_cis', 'female_cis', 'male_trans', 'female_trans', 'non_binary', 'prefer_not_to_say') NOT NULL, \`date_of_birth\` date NOT NULL, \`phone\` char(11) NOT NULL, \`cpf\` char(11) NOT NULL, \`state\` enum ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO') NOT NULL, \`city\` varchar(50) NOT NULL, \`has_disability\` tinyint(1) NOT NULL DEFAULT '0', \`disability_desc\` varchar(500) NULL, \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0', \`take_medication\` tinyint(1) NOT NULL DEFAULT '0', \`medication_desc\` varchar(500) NULL, \`has_nmo_diagnosis\` tinyint(1) NOT NULL DEFAULT '0', \`status\` enum ('active', 'inactive') NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5947301223f5a908fd5e372b0f\` (\`cpf\`), UNIQUE INDEX \`REL_7fe1518dc780fd777669b5cb7a\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`specialists\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`specialty\` varchar(255) NOT NULL, \`registry\` varchar(255) NOT NULL, \`status\` enum ('active', 'inactive', 'pending') NOT NULL DEFAULT 'active', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`REL_87af021a252c9d5c4c008ad02a\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointments\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`specialist_id\` varchar(255) NOT NULL, \`date\` date NOT NULL, \`status\` enum ('scheduled', 'canceled', 'completed', 'no_show') NOT NULL, \`condition\` enum ('in_crisis', 'stable') NULL, \`annotation\` varchar(500) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` varchar(255) NULL, \`email\` varchar(255) NULL, \`token\` varchar(255) NOT NULL, \`type\` enum ('access_token', 'password_reset', 'invite_token') NOT NULL, \`expires_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`patients-requirement\` ADD CONSTRAINT \`FK_4e04cba47ba902ed69af548273b\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`patient_supports\` ADD CONSTRAINT \`FK_62c23ddd34837a0c09faf875425\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD CONSTRAINT \`FK_7fe1518dc780fd777669b5cb7a0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`specialists\` ADD CONSTRAINT \`FK_87af021a252c9d5c4c008ad02a0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_3330f054416745deaa2cc130700\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_76e86d9052e7a6543535357426e\` FOREIGN KEY (\`specialist_id\`) REFERENCES \`specialists\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_76e86d9052e7a6543535357426e\``);
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_3330f054416745deaa2cc130700\``);
        await queryRunner.query(`ALTER TABLE \`specialists\` DROP FOREIGN KEY \`FK_87af021a252c9d5c4c008ad02a0\``);
        await queryRunner.query(`ALTER TABLE \`patients\` DROP FOREIGN KEY \`FK_7fe1518dc780fd777669b5cb7a0\``);
        await queryRunner.query(`ALTER TABLE \`patient_supports\` DROP FOREIGN KEY \`FK_62c23ddd34837a0c09faf875425\``);
        await queryRunner.query(`ALTER TABLE \`patients-requirement\` DROP FOREIGN KEY \`FK_4e04cba47ba902ed69af548273b\``);
        await queryRunner.query(`DROP TABLE \`tokens\``);
        await queryRunner.query(`DROP TABLE \`appointments\``);
        await queryRunner.query(`DROP INDEX \`REL_87af021a252c9d5c4c008ad02a\` ON \`specialists\``);
        await queryRunner.query(`DROP TABLE \`specialists\``);
        await queryRunner.query(`DROP INDEX \`REL_7fe1518dc780fd777669b5cb7a\` ON \`patients\``);
        await queryRunner.query(`DROP INDEX \`IDX_5947301223f5a908fd5e372b0f\` ON \`patients\``);
        await queryRunner.query(`DROP TABLE \`patients\``);
        await queryRunner.query(`DROP TABLE \`patient_supports\``);
        await queryRunner.query(`DROP TABLE \`patients-requirement\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
