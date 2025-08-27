import { INestApplication } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import cookieParser from 'cookie-parser';
import * as mysql from 'mysql2/promise';
import { DataSource } from 'typeorm';

import { AppModule } from '@/app/app.module';
import { HttpExceptionFilter } from '@/common/http.exception.filter';
import { GlobalZodValidationPipe } from '@/common/zod.validation.pipe';
import { EnvService } from '@/env/env.service';

export class TestApp {
  private static cachedApp: {
    app: INestApplication;
    module: TestingModule;
    dataSource: DataSource;
  } | null = null;

  static async create(
    options: { silent?: boolean; useCache?: boolean } = {},
  ): Promise<{
    app: INestApplication;
    module: TestingModule;
    dataSource: DataSource;
  }> {
    // Return cached app if available and cache is enabled
    if (options.useCache !== false && this.cachedApp) {
      return this.cachedApp;
    }

    // Set NODE_ENV to test for proper configuration
    process.env.NODE_ENV = 'test';

    // Create test schema first (only if not cached)
    if (!this.cachedApp) {
      await this.createTestSchema();
    }

    // Suppress NestJS logs during test setup if silent mode is enabled
    const originalLogger = console.log;
    const originalWarn = console.warn;
    const originalError = console.error;

    if (options.silent !== false) {
      console.log = () => {};
      console.warn = () => {};
      console.error = () => {};
    }

    try {
      const module: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      // Disable logger for the app instance
      const app = module.createNestApplication({
        logger: false,
      });

      // Configure app with the same middlewares as main app
      const envService = module.get(EnvService);
      app.use(cookieParser(envService.get('COOKIE_SECRET')));
      app.useGlobalPipes(new GlobalZodValidationPipe());
      app.useGlobalFilters(new HttpExceptionFilter());

      // Wait for the app to initialize
      await app.init();

      // Get the DataSource from the module
      const dataSource = module.get<DataSource>(DataSource);

      // Ensure the connection is established
      if (!dataSource.isInitialized) {
        await dataSource.initialize();
      }

      await this.setupTestDatabase(dataSource);

      const result = { app, module, dataSource };

      // Cache the result if caching is enabled
      if (options.useCache !== false) {
        this.cachedApp = result;
      }

      return result;
    } finally {
      // Restore console methods
      if (options.silent !== false) {
        console.log = originalLogger;
        console.warn = originalWarn;
        console.error = originalError;
      }
    }
  }

  static async createTestSchema(): Promise<void> {
    const testSchema = process.env.DB_SCHEMA;
    if (!testSchema) {
      return; // No schema specified, skip
    }

    try {
      // Create temporary connection to create schema
      const connection = await mysql.createConnection({
        host: process.env.DB_HOST || 'localhost',
        port: parseInt(process.env.DB_PORT || '3306'),
        user: process.env.DB_USERNAME,
        password: process.env.DB_PASSWORD,
      });

      // Create test schema if it doesn't exist (in MySQL, schema = database)
      await connection.execute(
        `CREATE DATABASE IF NOT EXISTS \`${testSchema}\``,
      );
      await connection.end();

      // Removed console.log for cleaner test output
    } catch (error) {
      console.error('Error creating test schema:', error);
      throw error;
    }
  }

  static async setupTestDatabase(dataSource: DataSource): Promise<void> {
    try {
      if (process.env.NODE_ENV === 'test') {
        // Skip table synchronization - assume database already has the correct schema
        // This improves performance as we don't need to check or create tables
        // The database should already be set up with the correct schema via migrations

        // Just ensure we're using the correct test schema
        const testSchema = process.env.DB_SCHEMA;
        if (testSchema) {
          await dataSource.query(`USE \`${testSchema}\``);
        }

        // Removed console.log for cleaner test output
      }
    } catch (error) {
      console.error('Error setting up test database:', error);
      throw error;
    }
  }

  static async clearDatabase(dataSource: DataSource): Promise<void> {
    if (!dataSource || !dataSource.isInitialized) {
      console.warn('DataSource not initialized, skipping database clear');
      return;
    }

    try {
      const testSchema = process.env.DB_SCHEMA;

      // If using test schema, ensure we're in the correct schema
      if (testSchema) {
        await dataSource.query(`USE \`${testSchema}\``);
      }

      // Use transaction for faster clearing
      await dataSource.transaction(async (manager) => {
        // Disable foreign key checks temporarily
        await manager.query('SET FOREIGN_KEY_CHECKS = 0');

        const entities = dataSource.entityMetadatas;

        // Clear all tables using repository.clear() - this is reliable
        for (const entity of entities) {
          const repository = manager.getRepository(entity.name);
          await repository.clear();
        }

        // Re-enable foreign key checks
        await manager.query('SET FOREIGN_KEY_CHECKS = 1');
      });
    } catch (error) {
      console.error('Error clearing test database:', error);
      throw error;
    }
  }

  static async destroy(
    app: INestApplication,
    dataSource: DataSource,
  ): Promise<void> {
    try {
      if (app) {
        await app.close();
      }

      if (dataSource && dataSource.isInitialized) {
        await dataSource.destroy();
      }

      // Clear cache when destroying
      this.cachedApp = null;
    } catch (error) {
      console.error('Error destroying test app:', error);
      // Don't throw here to avoid masking other test failures
    }
  }

  static clearCache(): void {
    this.cachedApp = null;
  }
}
