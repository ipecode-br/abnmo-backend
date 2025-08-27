# ✅ E2E Testing - Zero Boilerplate Setup

## Overview

This NestJS application now features a **completely automated E2E testing environment** that requires **zero boilerplate code** in your test files. Just write your tests, and everything else is handled automatically!

## 🎯 Key Benefits

- ✅ **Zero Boilerplate**: No `beforeAll`, `afterAll`, `beforeEach`, `afterEach` needed in test files
- ✅ **Silent Execution**: All NestJS logs are suppressed during tests for clean output
- ✅ **Automatic Cleanup**: Database is cleared before/after each test automatically
- ✅ **Global App Instance**: Single app instance shared across all tests (faster execution)
- ✅ **Real API Testing**: Tests work exactly like Postman/Insomnia requests

## 📝 Writing Tests (The New Way)

### Simple Test Example

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from './setup';

describe('My Feature E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp(); // That's it! No async, no setup, no cleanup!
  });

  it('should work perfectly', async () => {
    const response = await request(app.getHttpServer()).get('/my-endpoint');

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });

  it('should handle POST requests', async () => {
    const response = await request(app.getHttpServer())
      .post('/my-endpoint')
      .send({ key: 'value' });

    expect(response.status).toBe(201);
  });
});
```

### Authentication Test Example

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { getTestApp } from './setup';

describe('Auth E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('should register and login user', async () => {
    // Register
    const registerResponse = await request(app.getHttpServer())
      .post('/register')
      .send({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User',
      });

    expect([200, 201].includes(registerResponse.status)).toBe(true);

    // Login
    const loginResponse = await request(app.getHttpServer())
      .post('/login')
      .send({
        email: 'test@example.com',
        password: 'password123',
      });

    expect([200, 201].includes(loginResponse.status)).toBe(true);
  });
});
```

## 🚀 Running Tests

```bash
# Run all E2E tests
npm run test:e2e

# Run specific test file
npm run test:e2e -- auth.e2e-spec.ts

# Run in watch mode
npm run test:e2e -- --watch
```

## 🎛️ What Happens Automatically

### Global Setup (`test/setup.ts`)

Automatically handles:

1. **App Creation**: Creates NestJS app instance once for all tests
2. **Log Suppression**: Hides all NestJS console output during tests
3. **Database Cleanup**: Clears database before and after each test
4. **Error Handling**: Manages unhandled promises and cleanup
5. **Helper Functions**: Provides `getTestApp()` and `getTestDataSource()`

### Test Lifecycle

```
[Global Setup] → Create App Instance + Suppress Logs
↓
[Before Each Test] → Clear Database
↓
[Your Test] → Runs with clean database
↓
[After Each Test] → Clear Database Again
↓
[Global Teardown] → Cleanup App Instance
```

## 📁 Current Working Examples

All these files demonstrate the new zero-boilerplate approach:

- **`test/app.e2e-spec.ts`** - Basic app connectivity
- **`test/auth.e2e-spec.ts`** - Authentication endpoints
- **`test/patients.e2e-spec.ts`** - Patient management

Each file is clean and focused only on the actual tests!

## ⚙️ Configuration Files

### `test/jest-e2e.json`

```json
{
  "moduleFileExtensions": ["js", "json", "ts"],
  "rootDir": ".",
  "testEnvironment": "node",
  "testRegex": ".e2e-spec.ts$",
  "transform": {
    "^.+\\.(t|ts)$": "ts-jest"
  },
  "maxWorkers": 1,
  "setupFilesAfterEnv": ["<rootDir>/setup.ts"],
  "moduleNameMapper": {
    "^@/(.*)$": "<rootDir>/../src/$1"
  },
  "testTimeout": 60000
}
```

### `.env.test`

```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=abnmo_database  # Same as development
DB_USERNAME=abnmo_user
DB_PASSWORD=abnmo_password
# ... other env vars
```

## 🔧 Helper Functions Available

### `getTestApp()`

Returns the global NestJS application instance.

```typescript
import { getTestApp } from './setup';

const app = getTestApp();
const response = await request(app.getHttpServer()).get('/endpoint');
```

### `getTestDataSource()`

Returns the global TypeORM DataSource (if you need direct database access).

```typescript
import { getTestDataSource } from './setup';

const dataSource = getTestDataSource();
const userRepo = dataSource.getRepository(User);
const users = await userRepo.find();
```

## 🐛 Troubleshooting

### Database Connection Issues

```bash
# Ensure Docker is running
docker-compose -f infra/docker/compose-dev.yaml up -d

# Check database is accessible
mysql -h localhost -u abnmo_user -p abnmo_database
```

### Tests Running Slow

- Tests run with `maxWorkers: 1` to prevent database conflicts
- Single app instance is shared across all tests for faster execution
- Database cleanup is optimized to only clear data, not recreate schema

### Module Resolution Issues

- Check that `@/` path mapping works in your IDE
- Ensure `moduleNameMapper` in `jest-e2e.json` is correct
- Verify file paths in import statements

## 📊 Test Results Example

```
> npm run test:e2e

 PASS  test/app.e2e-spec.ts
 PASS  test/auth.e2e-spec.ts
 PASS  test/patients.e2e-spec.ts

Test Suites: 3 passed, 3 total
Tests:       6 passed, 6 total
Snapshots:   0 total
Time:        7.2s
```

Clean output with no NestJS logs cluttering the terminal!

## ✨ Migration Guide

To convert existing E2E tests to the new zero-boilerplate approach:

### Before

```typescript
describe('Old Test', () => {
  let app: INestApplication;
  let dataSource: DataSource;

  beforeAll(async () => {
    const testAppSetup = await TestApp.create();
    app = testAppSetup.app;
    dataSource = testAppSetup.dataSource;
  });

  afterAll(async () => {
    await TestApp.destroy(app, dataSource);
  });

  beforeEach(async () => {
    await TestApp.clearDatabase(dataSource);
  });

  afterEach(async () => {
    await TestApp.clearDatabase(dataSource);
  });

  // tests...
});
```

### After

```typescript
import { getTestApp } from './setup';

describe('New Test', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  // tests...
});
```

That's it! Remove ~20 lines of boilerplate and focus on writing actual tests! 🎉
