import { MigrationInterface, QueryRunner } from "typeorm";

export class AddFillingMethodTable1785366355570 implements MigrationInterface {
    name = 'AddFillingMethodTable1785366355570'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "webhooks_events" RENAME TO "webhook_events"`);
        await queryRunner.query(`ALTER TYPE "webhooks_events_event_enum" RENAME TO "webhook_events_event_enum"`);
        await queryRunner.query(`ALTER TYPE "webhooks_events_status_enum" RENAME TO "webhook_events_status_enum"`);
        await queryRunner.query(`CREATE TYPE "survey_submissions_filling_method_enum" AS ENUM('self', 'whatsapp', 'interview')`);
        await queryRunner.query(`ALTER TABLE "survey_submissions" ADD "filling_method" "survey_submissions_filling_method_enum" NOT NULL`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_submissions" DROP COLUMN "filling_method"`);
        await queryRunner.query(`DROP TYPE "survey_submissions_filling_method_enum"`);
        await queryRunner.query(`ALTER TYPE "webhook_events_status_enum" RENAME TO "webhooks_events_status_enum"`);
        await queryRunner.query(`ALTER TYPE "webhook_events_event_enum" RENAME TO "webhooks_events_event_enum"`);
        await queryRunner.query(`ALTER TABLE "webhook_events" RENAME TO "webhooks_events"`);
    }

}
