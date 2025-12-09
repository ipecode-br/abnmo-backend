import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1765286865155 implements MigrationInterface {
    name = 'Initial1765286865155'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`users\` (\`id\` varchar(36) NOT NULL, \`name\` varchar(255) NOT NULL, \`email\` varchar(255) NOT NULL, \`password\` varchar(255) NOT NULL, \`role\` enum ('admin', 'nurse', 'specialist', 'manager', 'patient') NOT NULL DEFAULT 'patient', \`avatar_url\` varchar(255) NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_97672ac88f789774dd47f7c8be\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patient_requirements\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`type\` enum ('screening', 'medical_report') NOT NULL, \`title\` varchar(255) NOT NULL, \`description\` varchar(500) NULL, \`status\` enum ('pending', 'under_review', 'approved', 'declined') NOT NULL DEFAULT 'pending', \`required_by\` varchar(255) NOT NULL, \`approved_by\` varchar(255) NULL, \`approved_at\` timestamp NULL, \`submitted_at\` timestamp NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patient_supports\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`name\` varchar(255) NOT NULL, \`phone\` char(11) NOT NULL, \`kinship\` varchar(50) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`referrals\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`date\` timestamp NOT NULL, \`status\` enum ('scheduled', 'canceled', 'completed', 'no_show') NOT NULL DEFAULT 'scheduled', \`category\` enum ('medical_care', 'legal', 'nursing', 'psychology', 'nutrition', 'physical_training', 'social_work', 'psychiatry', 'neurology', 'ophthalmology') NOT NULL, \`condition\` enum ('in_crisis', 'stable') NOT NULL, \`annotation\` varchar(2000) NULL, \`professional_name\` varchar(255) NULL, \`created_by\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`patients\` (\`id\` varchar(36) NOT NULL, \`user_id\` varchar(255) NOT NULL, \`gender\` enum ('male_cis', 'female_cis', 'male_trans', 'female_trans', 'non_binary', 'prefer_not_to_say') NOT NULL, \`date_of_birth\` date NOT NULL, \`phone\` char(11) NOT NULL, \`cpf\` char(11) NOT NULL, \`state\` enum ('AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO') NOT NULL, \`city\` varchar(50) NOT NULL, \`has_disability\` tinyint(1) NOT NULL DEFAULT '0', \`disability_desc\` varchar(500) NULL, \`need_legal_assistance\` tinyint(1) NOT NULL DEFAULT '0', \`take_medication\` tinyint(1) NOT NULL DEFAULT '0', \`medication_desc\` varchar(500) NULL, \`has_nmo_diagnosis\` tinyint(1) NOT NULL DEFAULT '0', \`status\` enum ('active', 'inactive', 'pending') NOT NULL DEFAULT 'pending', \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), UNIQUE INDEX \`IDX_5947301223f5a908fd5e372b0f\` (\`cpf\`), UNIQUE INDEX \`REL_7fe1518dc780fd777669b5cb7a\` (\`user_id\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`appointments\` (\`id\` varchar(36) NOT NULL, \`patient_id\` varchar(255) NOT NULL, \`date\` timestamp NOT NULL, \`status\` enum ('scheduled', 'canceled', 'completed', 'no_show') NOT NULL DEFAULT 'scheduled', \`category\` enum ('medical_care', 'legal', 'nursing', 'psychology', 'nutrition', 'physical_training', 'social_work', 'psychiatry', 'neurology', 'ophthalmology') NOT NULL, \`condition\` enum ('in_crisis', 'stable') NOT NULL, \`annotation\` varchar(500) NULL, \`professional_name\` varchar(255) NULL, \`created_by\` varchar(255) NOT NULL, \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), \`updated_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6) ON UPDATE CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`tokens\` (\`id\` int NOT NULL AUTO_INCREMENT, \`user_id\` varchar(255) NULL, \`email\` varchar(255) NULL, \`token\` varchar(255) NOT NULL, \`type\` enum ('access_token', 'password_reset', 'invite_token') NOT NULL, \`expires_at\` timestamp(6) NULL DEFAULT CURRENT_TIMESTAMP(6), \`created_at\` timestamp(6) NOT NULL DEFAULT CURRENT_TIMESTAMP(6), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`patient_requirements\` ADD CONSTRAINT \`FK_77b87c61cff4793ae6a4ac50070\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`patient_supports\` ADD CONSTRAINT \`FK_62c23ddd34837a0c09faf875425\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`referrals\` ADD CONSTRAINT \`FK_bb61873c1c10fe8662f540f0625\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`patients\` ADD CONSTRAINT \`FK_7fe1518dc780fd777669b5cb7a0\` FOREIGN KEY (\`user_id\`) REFERENCES \`users\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`appointments\` ADD CONSTRAINT \`FK_3330f054416745deaa2cc130700\` FOREIGN KEY (\`patient_id\`) REFERENCES \`patients\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`appointments\` DROP FOREIGN KEY \`FK_3330f054416745deaa2cc130700\``);
        await queryRunner.query(`ALTER TABLE \`patients\` DROP FOREIGN KEY \`FK_7fe1518dc780fd777669b5cb7a0\``);
        await queryRunner.query(`ALTER TABLE \`referrals\` DROP FOREIGN KEY \`FK_bb61873c1c10fe8662f540f0625\``);
        await queryRunner.query(`ALTER TABLE \`patient_supports\` DROP FOREIGN KEY \`FK_62c23ddd34837a0c09faf875425\``);
        await queryRunner.query(`ALTER TABLE \`patient_requirements\` DROP FOREIGN KEY \`FK_77b87c61cff4793ae6a4ac50070\``);
        await queryRunner.query(`DROP TABLE \`tokens\``);
        await queryRunner.query(`DROP TABLE \`appointments\``);
        await queryRunner.query(`DROP INDEX \`REL_7fe1518dc780fd777669b5cb7a\` ON \`patients\``);
        await queryRunner.query(`DROP INDEX \`IDX_5947301223f5a908fd5e372b0f\` ON \`patients\``);
        await queryRunner.query(`DROP TABLE \`patients\``);
        await queryRunner.query(`DROP TABLE \`referrals\``);
        await queryRunner.query(`DROP TABLE \`patient_supports\``);
        await queryRunner.query(`DROP TABLE \`patient_requirements\``);
        await queryRunner.query(`DROP INDEX \`IDX_97672ac88f789774dd47f7c8be\` ON \`users\``);
        await queryRunner.query(`DROP TABLE \`users\``);
    }

}
