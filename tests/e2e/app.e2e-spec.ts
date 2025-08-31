import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { getTestApp, getTestDataSource } from '../config/setup';

describe('AppController (e2e)', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(() => {
    app = getTestApp();
    dataSource = getTestDataSource();
  });

  it('should have a working test environment', () => {
    expect(app).toBeDefined();
    expect(dataSource).toBeDefined();
    expect(dataSource.isInitialized).toBe(true);
  });

  it('should have a clean database', async () => {
    // Example test to verify database is clean
    const entities = dataSource.entityMetadatas;

    for (const entity of entities) {
      const count = await dataSource.getRepository(entity.target).count();
      expect(count).toBe(0);
    }
  });
});
