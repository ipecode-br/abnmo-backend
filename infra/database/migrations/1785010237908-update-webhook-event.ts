import { MigrationInterface, QueryRunner } from "typeorm";

export class UpdateWebhookEvent1785010237908 implements MigrationInterface {
    name = 'UpdateWebhookEvent1785010237908'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhooks_events" RENAME COLUMN "path" TO "event"`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" DROP COLUMN "event"`);
        await queryRunner.query(`CREATE TYPE "webhooks_events_event_enum" AS ENUM('sign_survey')`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ADD "event" "webhooks_events_event_enum" NOT NULL`);
        await queryRunner.query(`ALTER TYPE "webhooks_events_status_enum" RENAME TO "webhooks_events_status_enum_old"`);
        await queryRunner.query(`CREATE TYPE "webhooks_events_status_enum" AS ENUM('received', 'success', 'failed')`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ALTER COLUMN "status" TYPE "webhooks_events_status_enum" USING "status"::"text"::"webhooks_events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ALTER COLUMN "status" SET DEFAULT 'received'`);
        await queryRunner.query(`DROP TYPE "webhooks_events_status_enum_old"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "webhooks_events_status_enum_old" AS ENUM('pending', 'success', 'failed')`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ALTER COLUMN "status" DROP DEFAULT`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ALTER COLUMN "status" TYPE "webhooks_events_status_enum_old" USING "status"::"text"::"webhooks_events_status_enum_old"`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ALTER COLUMN "status" SET DEFAULT 'success'`);
        await queryRunner.query(`DROP TYPE "webhooks_events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "webhooks_events_status_enum_old" RENAME TO "webhooks_events_status_enum"`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" DROP COLUMN "event"`);
        await queryRunner.query(`DROP TYPE "webhooks_events_event_enum"`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" ADD "event" character varying(255) NOT NULL`);
        await queryRunner.query(`ALTER TABLE "webhooks_events" RENAME COLUMN "event" TO "path"`);
    }

}
