import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateWebhookEvents1785007842422 implements MigrationInterface {
    name = 'CreateWebhookEvents1785007842422'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "webhooks_events_status_enum" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`CREATE TABLE "webhooks_events" ("id" uuid NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "path" character varying(255) NOT NULL, "status" "webhooks_events_status_enum" NOT NULL DEFAULT 'success', "payload" jsonb NOT NULL, CONSTRAINT "PK_5ea4a56327ed7ae50a01c694cc5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "surveys" ADD CONSTRAINT "UQ_40b9e0677f8ab302e262bd14586" UNIQUE ("signature_id")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" DROP CONSTRAINT "UQ_40b9e0677f8ab302e262bd14586"`);
        await queryRunner.query(`DROP TABLE "webhooks_events"`);
        await queryRunner.query(`DROP TYPE "webhooks_events_status_enum"`);
    }

}
