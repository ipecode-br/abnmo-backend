import { MigrationInterface, QueryRunner } from "typeorm";

export class AddMonthsToTimeUnits1785270045717 implements MigrationInterface {
    name = 'AddMonthsToTimeUnits1785270045717'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TYPE "surveys_time_to_diagnosis_unit_enum" ADD VALUE 'months'`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "surveys_time_to_diagnosis_unit_enum_old" AS ENUM('days', 'weeks', 'years')`);
        await queryRunner.query(`ALTER TABLE "surveys" ALTER COLUMN "time_to_diagnosis_unit" TYPE "surveys_time_to_diagnosis_unit_enum_old" USING "time_to_diagnosis_unit"::"text"::"surveys_time_to_diagnosis_unit_enum_old"`);
        await queryRunner.query(`DROP TYPE "surveys_time_to_diagnosis_unit_enum"`);
        await queryRunner.query(`ALTER TYPE "surveys_time_to_diagnosis_unit_enum_old" RENAME TO "surveys_time_to_diagnosis_unit_enum"`);
    }

}
