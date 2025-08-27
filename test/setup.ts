// Global test setup for E2E tests
import { INestApplication } from '@nestjs/common';
import { DataSource } from 'typeorm';

import { TestApp } from './test-utils';

declare global {
  var __E2E_APP__: INestApplication;
  var __E2E_DATASOURCE__: DataSource;
  var __E2E_MODULE__: any;
}

// Set test environment
process.env.NODE_ENV = 'test';

// Global test timeout
jest.setTimeout(60000);

// Global setup - create app once for all tests
let globalApp: INestApplication;
let globalDataSource: DataSource;
let isSetupComplete = false;

beforeAll(async () => {
  // Skip setup if already completed (useful for watch mode)
  if (isSetupComplete && globalApp && globalDataSource) {
    global.__E2E_APP__ = globalApp;
    global.__E2E_DATASOURCE__ = globalDataSource;
    return;
  }

  // Allow logs during schema setup to see what's happening
  try {
    const testAppSetup = await TestApp.create({
      silent: false,
      useCache: true, // Enable caching for better performance
    });
    globalApp = testAppSetup.app;
    globalDataSource = testAppSetup.dataSource;

    // Make available globally
    global.__E2E_APP__ = globalApp;
    global.__E2E_DATASOURCE__ = globalDataSource;
    global.__E2E_MODULE__ = testAppSetup.module;

    isSetupComplete = true;
  } finally {
    // Suppress logs for the actual tests
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};
  }
});

// Helper functions to get app and dataSource
export const getTestApp = (): INestApplication => {
  if (!global.__E2E_APP__) {
    throw new Error(
      'Test app is not available. Make sure you are running E2E tests.',
    );
  }
  return global.__E2E_APP__;
};

export const getTestDataSource = (): DataSource => {
  if (!global.__E2E_DATASOURCE__) {
    throw new Error(
      'Test dataSource is not available. Make sure you are running E2E tests.',
    );
  }
  return global.__E2E_DATASOURCE__;
};

// Global cleanup for each test - only clear before tests, not after
beforeEach(async () => {
  const dataSource = getTestDataSource();
  await TestApp.clearDatabase(dataSource);
});

// Remove afterEach cleanup to avoid double clearing

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection at:', promise, 'reason:', reason);
});

// Global teardown
afterAll(async () => {
  if (globalApp && globalDataSource) {
    await TestApp.destroy(globalApp, globalDataSource);
  }

  // Give time for cleanup
  await new Promise((resolve) => setTimeout(resolve, 500));
});
