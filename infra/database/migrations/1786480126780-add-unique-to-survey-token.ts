import { MigrationInterface, QueryRunner } from "typeorm";

export class AddUniqueToSurveyToken1786480126780 implements MigrationInterface {
    name = 'AddUniqueToSurveyToken1786480126780'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP INDEX "IDX_9d904bf2b6f4eab195f3f98973"`);
        await queryRunner.query(`ALTER TABLE "survey_submissions" ADD CONSTRAINT "UQ_9d904bf2b6f4eab195f3f989733" UNIQUE ("survey_token")`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_submissions" DROP CONSTRAINT "UQ_9d904bf2b6f4eab195f3f989733"`);
        await queryRunner.query(`CREATE INDEX "IDX_9d904bf2b6f4eab195f3f98973" ON "survey_submissions" USING btree ("survey_token") `);
    }

}
