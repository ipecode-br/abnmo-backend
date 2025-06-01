import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangesLanguage1748563006325 implements MigrationInterface {
    name = 'ChangesLanguage1748563006325'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`support\` (\`id_support\` int NOT NULL AUTO_INCREMENT, \`support_name\` varchar(100) NOT NULL, \`relation\` varchar(50) NOT NULL, \`whatsapp\` char(11) NOT NULL, \`id_patient\` int NOT NULL, \`id_paciente\` int NULL, PRIMARY KEY (\`id_support\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuarios\` (\`id\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(320) NOT NULL, \`password\` varchar(50) NULL, \`flag_login_facebook\` tinyint(1) NOT NULL DEFAULT '0', \`flag_login_gmail\` tinyint(1) NOT NULL DEFAULT '0', \`id_oauth\` varchar(255) NULL, \`token_oauth\` text NULL, \`fullname\` varchar(100) NOT NULL, \`data_cadastro\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`flag_is_removed\` tinyint(1) NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pacientes\` (\`id_gender\` int NOT NULL AUTO_INCREMENT, \`desc_gender\` varchar(100) NOT NULL, \`birth_of_date\` date NOT NULL, \`city\` varchar(50) NOT NULL, \`state\` char(2) NOT NULL, \`whatsapp\` char(11) NOT NULL, \`cpf\` char(11) NOT NULL, \`url_photo\` varchar(255) NOT NULL, \`have_disability\` tinyint(1) NOT NULL DEFAULT '0', \`desc_disability\` varchar(500) NULL, \`need_legal_help\` tinyint(1) NOT NULL DEFAULT '0', \`use_medicine\` tinyint(1) NOT NULL DEFAULT '0', \`desc_medicine\` varchar(500) NULL, \`filename_diagnostic\` varchar(200) NULL, \`flag_active\` tinyint(1) NOT NULL DEFAULT '0', \`id_diagnostic\` int NOT NULL, \`id_user\` int NOT NULL, \`id_diagnostico\` int NULL, \`id_usuario\` int NULL, UNIQUE INDEX \`REL_afb3f6792b37ee465e151e277b\` (\`id_usuario\`), PRIMARY KEY (\`id_gender\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`diagnostics\` (\`id\` int NOT NULL AUTO_INCREMENT, \`desc_diagnostic\` varchar(40) NOT NULL, PRIMARY KEY (\`id\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`support\` ADD CONSTRAINT \`FK_759111c91e22329350ff7305435\` FOREIGN KEY (\`id_paciente\`) REFERENCES \`pacientes\`(\`id_gender\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pacientes\` ADD CONSTRAINT \`FK_d03105ab5ad001b526846afce8d\` FOREIGN KEY (\`id_diagnostico\`) REFERENCES \`diagnostics\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pacientes\` ADD CONSTRAINT \`FK_afb3f6792b37ee465e151e277bb\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuarios\`(\`id\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pacientes\` DROP FOREIGN KEY \`FK_afb3f6792b37ee465e151e277bb\``);
        await queryRunner.query(`ALTER TABLE \`pacientes\` DROP FOREIGN KEY \`FK_d03105ab5ad001b526846afce8d\``);
        await queryRunner.query(`ALTER TABLE \`support\` DROP FOREIGN KEY \`FK_759111c91e22329350ff7305435\``);
        await queryRunner.query(`DROP TABLE \`diagnostics\``);
        await queryRunner.query(`DROP INDEX \`REL_afb3f6792b37ee465e151e277b\` ON \`pacientes\``);
        await queryRunner.query(`DROP TABLE \`pacientes\``);
        await queryRunner.query(`DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`support\``);
    }

}
