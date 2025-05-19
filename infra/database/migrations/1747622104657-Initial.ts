import { MigrationInterface, QueryRunner } from "typeorm";

export class Initial1747622104657 implements MigrationInterface {
    name = 'Initial1747622104657'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE \`apoios\` (\`id_apoio\` int NOT NULL AUTO_INCREMENT, \`nome_apoio\` varchar(100) NOT NULL, \`parentesco\` varchar(50) NOT NULL, \`whatsapp\` char(11) NOT NULL, \`id_paciente\` int NOT NULL, PRIMARY KEY (\`id_apoio\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`usuarios\` (\`id_usuario\` int NOT NULL AUTO_INCREMENT, \`email\` varchar(320) NOT NULL, \`senha\` varchar(50) NULL, \`flag_login_facebook\` tinyint(1) NOT NULL DEFAULT '0', \`flag_login_gmail\` tinyint(1) NOT NULL DEFAULT '0', \`id_oauth\` varchar(255) NULL, \`token_oauth\` text NULL, \`nome_completo\` varchar(100) NOT NULL, \`data_cadastro\` datetime NOT NULL DEFAULT CURRENT_TIMESTAMP, \`flag_deletado\` tinyint(1) NOT NULL DEFAULT '0', UNIQUE INDEX \`IDX_446adfc18b35418aac32ae0b7b\` (\`email\`), PRIMARY KEY (\`id_usuario\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`pacientes\` (\`id_paciente\` int NOT NULL AUTO_INCREMENT, \`desc_genero\` varchar(100) NOT NULL, \`data_nascimento\` date NOT NULL, \`cidade\` varchar(50) NOT NULL, \`sigla_estado\` char(2) NOT NULL, \`whatsapp\` char(11) NOT NULL, \`cpf\` char(11) NOT NULL, \`url_foto\` varchar(255) NOT NULL, \`possui_deficiencia\` tinyint(1) NOT NULL DEFAULT '0', \`desc_deficiencias\` varchar(500) NULL, \`precisa_assist_legal\` tinyint(1) NOT NULL DEFAULT '0', \`usa_medicamento\` tinyint(1) NOT NULL DEFAULT '0', \`desc_medicamentos\` varchar(500) NULL, \`filename_diagnostico\` varchar(200) NULL, \`flag_ativo\` tinyint(1) NOT NULL DEFAULT '0', \`id_diagnostico\` int NOT NULL, \`id_usuario\` int NOT NULL, UNIQUE INDEX \`REL_afb3f6792b37ee465e151e277b\` (\`id_usuario\`), PRIMARY KEY (\`id_paciente\`)) ENGINE=InnoDB`);
        await queryRunner.query(`CREATE TABLE \`diagnosticos\` (\`id_diagnostico\` int NOT NULL AUTO_INCREMENT, \`desc_diagnostico\` varchar(40) NOT NULL, PRIMARY KEY (\`id_diagnostico\`)) ENGINE=InnoDB`);
        await queryRunner.query(`ALTER TABLE \`apoios\` ADD CONSTRAINT \`FK_c492d26675dac50296d87ab3c64\` FOREIGN KEY (\`id_paciente\`) REFERENCES \`pacientes\`(\`id_paciente\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pacientes\` ADD CONSTRAINT \`FK_d03105ab5ad001b526846afce8d\` FOREIGN KEY (\`id_diagnostico\`) REFERENCES \`diagnosticos\`(\`id_diagnostico\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE \`pacientes\` ADD CONSTRAINT \`FK_afb3f6792b37ee465e151e277bb\` FOREIGN KEY (\`id_usuario\`) REFERENCES \`usuarios\`(\`id_usuario\`) ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE \`pacientes\` DROP FOREIGN KEY \`FK_afb3f6792b37ee465e151e277bb\``);
        await queryRunner.query(`ALTER TABLE \`pacientes\` DROP FOREIGN KEY \`FK_d03105ab5ad001b526846afce8d\``);
        await queryRunner.query(`ALTER TABLE \`apoios\` DROP FOREIGN KEY \`FK_c492d26675dac50296d87ab3c64\``);
        await queryRunner.query(`DROP TABLE \`diagnosticos\``);
        await queryRunner.query(`DROP INDEX \`REL_afb3f6792b37ee465e151e277b\` ON \`pacientes\``);
        await queryRunner.query(`DROP TABLE \`pacientes\``);
        await queryRunner.query(`DROP INDEX \`IDX_446adfc18b35418aac32ae0b7b\` ON \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`usuarios\``);
        await queryRunner.query(`DROP TABLE \`apoios\``);
    }

}
