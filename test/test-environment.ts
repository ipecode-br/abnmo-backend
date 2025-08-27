import type {
  EnvironmentContext,
  JestEnvironmentConfig,
} from '@jest/environment';
import NodeEnvironment from 'jest-environment-node';

import { TestApp } from './test-utils';

export default class E2ETestEnvironment extends NodeEnvironment {
  private originalConsoleLog: typeof console.log;
  private originalConsoleWarn: typeof console.warn;
  private originalConsoleError: typeof console.error;

  constructor(config: JestEnvironmentConfig, context: EnvironmentContext) {
    super(config, context);

    // Suppress console logs during tests
    this.originalConsoleLog = console.log;
    this.originalConsoleWarn = console.warn;
    this.originalConsoleError = console.error;
  }

  async setup(): Promise<void> {
    await super.setup();

    // Suppress NestJS logs during tests
    console.log = () => {};
    console.warn = () => {};
    console.error = () => {};

    // Create shared test app instance with silent logging
    const testAppSetup = await TestApp.create({ silent: true });

    // Make app and dataSource available globally
    this.global.__E2E_APP__ = testAppSetup.app;
    this.global.__E2E_DATASOURCE__ = testAppSetup.dataSource;
    this.global.__E2E_MODULE__ = testAppSetup.module;
  }

  async teardown(): Promise<void> {
    // Restore console methods
    console.log = this.originalConsoleLog;
    console.warn = this.originalConsoleWarn;
    console.error = this.originalConsoleError;

    // Clean up the test app
    if (this.global.__E2E_APP__ && this.global.__E2E_DATASOURCE__) {
      await TestApp.destroy(
        this.global.__E2E_APP__,
        this.global.__E2E_DATASOURCE__,
      );
    }

    await super.teardown();
  }
}
