import { MigrationInterface, QueryRunner } from "typeorm";

export class ReplaceTimeToDiagnosisWithDays1788273298878 implements MigrationInterface {
    name = 'ReplaceTimeToDiagnosisWithDays1788273298878'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "surveys" ADD "time_to_diagnosis_in_days" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "surveys" DROP COLUMN "time_to_diagnosis"`);
        await queryRunner.query(`ALTER TABLE "surveys" DROP COLUMN "time_to_diagnosis_unit"`);
        await queryRunner.query(`DROP TYPE "surveys_time_to_diagnosis_unit_enum"`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "surveys_time_to_diagnosis_unit_enum" AS ENUM('days', 'weeks', 'months', 'years')`);
        await queryRunner.query(`ALTER TABLE "surveys" ADD "time_to_diagnosis" integer NOT NULL DEFAULT 0`);
        await queryRunner.query(`ALTER TABLE "surveys" ADD "time_to_diagnosis_unit" "surveys_time_to_diagnosis_unit_enum" NOT NULL DEFAULT 'days'`);
        await queryRunner.query(`ALTER TABLE "surveys" DROP COLUMN "time_to_diagnosis_in_days"`);
    }

}
