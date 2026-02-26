import { MigrationInterface, QueryRunner } from 'typeorm';

export class ChangeDateOfBirthType1772111710863 implements MigrationInterface {
  name = 'ChangeDateOfBirthType1772111710863';

  public async up(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE patients
      MODIFY date_of_birth DATE NOT NULL
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    await queryRunner.query(`
      ALTER TABLE patients
      MODIFY date_of_birth DATETIME NOT NULL
    `);
  }
}
