import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import { config } from 'dotenv';
import { DataSource } from 'typeorm';

config({ path: '.env.test' });
process.env.NODE_ENV = 'test';

import { AppModule } from '@/app/app.module';
import { EnvService } from '@/env/env.service';

declare global {
  var __E2E_APP__: INestApplication;
  var __E2E_DATASOURCE__: DataSource;
}

jest.setTimeout(60000);

beforeAll(async () => {
  const moduleRef: TestingModule = await Test.createTestingModule({
    imports: [AppModule],
  }).compile();

  const app = moduleRef.createNestApplication({ logger: false });
  const envService = moduleRef.get(EnvService);
  app.use(cookieParser(envService.get('COOKIE_SECRET')));
  await app.init();

  global.__E2E_APP__ = app;
  global.__E2E_DATASOURCE__ = moduleRef.get(DataSource);
});

beforeEach(async () => {
  const dataSource = global.__E2E_DATASOURCE__;
  if (!dataSource?.isInitialized) return;

  const queryRunner = dataSource.createQueryRunner();
  await queryRunner.query('SET FOREIGN_KEY_CHECKS = 0');

  for (const entity of dataSource.entityMetadatas) {
    await queryRunner.query(`DELETE FROM \`${entity.tableName}\``);
  }

  await queryRunner.query('SET FOREIGN_KEY_CHECKS = 1');
  await queryRunner.release();
});

afterAll(async () => {
  const app = global.__E2E_APP__;
  const dataSource = global.__E2E_DATASOURCE__;

  if (app) await app.close();
  if (dataSource?.isInitialized) await dataSource.destroy();
});

export const getTestApp = (): INestApplication => {
  if (!global.__E2E_APP__) {
    throw new Error(
      'E2E app not initialized. Make sure jest-e2e.json is configured correctly.',
    );
  }
  return global.__E2E_APP__;
};

export const getTestDataSource = (): DataSource => {
  if (!global.__E2E_DATASOURCE__) {
    throw new Error(
      'E2E datasource not initialized. Make sure jest-e2e.json is configured correctly.',
    );
  }
  return global.__E2E_DATASOURCE__;
};
