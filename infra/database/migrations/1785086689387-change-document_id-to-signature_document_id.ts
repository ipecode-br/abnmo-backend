import { MigrationInterface, QueryRunner } from "typeorm";

export class ChangeDocumentIdToSignatureDocumentId1785086689387 implements MigrationInterface {
    name = 'ChangeDocumentIdToSignatureDocumentId1785086689387'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" RENAME COLUMN "document_id" TO "signature_document_id"`);
        await queryRunner.query(`ALTER TABLE "surveys" RENAME CONSTRAINT "UQ_a382bbf9b37b8043aeaf09ad4da" TO "UQ_bc84c12c5395f3c72f65dfdbd95"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" RENAME CONSTRAINT "UQ_bc84c12c5395f3c72f65dfdbd95" TO "UQ_a382bbf9b37b8043aeaf09ad4da"`);
        await queryRunner.query(`ALTER TABLE "surveys" RENAME COLUMN "signature_document_id" TO "document_id"`);
    }

}
