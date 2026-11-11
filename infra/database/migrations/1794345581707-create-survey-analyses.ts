import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateSurveyAnalyses1794345581707 implements MigrationInterface {
    name = 'CreateSurveyAnalyses1794345581707'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "survey_analyses_question_key_enum" AS ENUM('lifePerception', 'dreams', 'additionalInfo')`);
        await queryRunner.query(`CREATE TABLE "survey_analyses" ("id" uuid NOT NULL, "updated_at" TIMESTAMP NOT NULL DEFAULT now(), "created_at" TIMESTAMP NOT NULL DEFAULT now(), "question_key" "survey_analyses_question_key_enum" NOT NULL, "question" character varying(500) NOT NULL, "raw_response" text NOT NULL, "terms" jsonb NOT NULL, "prompt_version" character varying(16) NOT NULL, "model" character varying(32) NOT NULL, "patientId" uuid NOT NULL, CONSTRAINT "UQ_survey_analyses_patient_question" UNIQUE ("patientId", "question_key"), CONSTRAINT "PK_ae966e4f43deca7b2a698087c12" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "survey_analyses" ADD CONSTRAINT "FK_9870bd50cce03cbeda05b7e97d0" FOREIGN KEY ("patientId") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "survey_analyses" DROP CONSTRAINT "FK_9870bd50cce03cbeda05b7e97d0"`);
        await queryRunner.query(`DROP TABLE "survey_analyses"`);
        await queryRunner.query(`DROP TYPE "survey_analyses_question_key_enum"`);
    }

}
