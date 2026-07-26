import { MigrationInterface, QueryRunner } from "typeorm";

export class AddDocumentIdToSurveys1785032489906 implements MigrationInterface {
    name = 'AddDocumentIdToSurveys1785032489906'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" ADD "document_id" character varying(64)`);
        await queryRunner.query(`ALTER TABLE "surveys" ADD CONSTRAINT "UQ_a382bbf9b37b8043aeaf09ad4da" UNIQUE ("document_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" DROP CONSTRAINT "UQ_a382bbf9b37b8043aeaf09ad4da"`);
        await queryRunner.query(`ALTER TABLE "surveys" DROP COLUMN "document_id"`);
    }

}
