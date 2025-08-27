# E2E Testing Setup Documentation

## Overview

This E2E testing setup provides a complete isolated testing environment for the NestJS application with database cleanup and automatic isolation between tests.

## Key Features

- **Database Cleanup**: Uses the same database as development but with complete cleanup before and after each test
- **Automatic Isolation**: Database is cleared before and after each test to prevent conflicts
- **Real HTTP Requests**: Tests simulate actual API requests (like Postman/Insomnia)
- **Authentication Testing**: Supports token-based and cookie-based authentication testing
- **Concurrent Testing**: Tests run in isolation without affecting each other

## Current Working Setup

### Configuration Files

- `src/config/database.config.ts` - Database configuration factory
- `src/config/typeorm.config.ts` - TypeORM configurations for dev/test
- `.env.test` - Test environment variables

### Test Utilities

- `test/test-utils.ts` - Test application factory and database utilities
- `test/setup.ts` - Global test setup and teardown
- `test/jest-e2e.json` - Jest configuration for E2E tests
- `scripts/test-e2e.sh` - Script to run E2E tests with proper environment

### Working Tests

- `test/app.e2e-spec.ts` - Basic app connectivity and database tests
- `test/auth.e2e-spec.ts` - Authentication endpoints tests (register/login)
- `test/patients.e2e-spec.ts` - Patient management endpoints tests

## Environment Setup

### Database Configuration

Your `.env.test` file should contain:

```bash
NODE_ENV=test
DB_HOST=localhost
DB_PORT=3306
DB_DATABASE=abnmo_database  # Same database as development
DB_USERNAME=abnmo_user
DB_PASSWORD=abnmo_password
# ... other required env vars from your main .env file
```

**Important**: The tests use the same database as development but with complete cleanup between tests. This ensures consistency while maintaining test isolation.

The test setup will automatically:

- Create test database if it doesn't exist
- Use a separate database name (`{DB_DATABASE}_test_e2e`)
- Synchronize schema on each test run
- Clean up after tests complete

## Running Tests

### Available Scripts

```bash
# Run E2E tests
npm run test:e2e

# Run E2E tests in watch mode
npm run test:e2e:watch

# Run E2E tests with coverage
npm run test:e2e:cov

# Debug E2E tests
npm run test:e2e:debug
```

## Writing E2E Tests

### Basic Test Structure

```typescript
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { DataSource } from 'typeorm';
import { TestApp } from './test-utils';

describe('Feature (e2e)', () => {
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

  it('should test endpoint', async () => {
    const response = await request(app.getHttpServer())
      .post('/endpoint')
      .send({ data: 'test' })
      .expect(201);

    expect(response.body).toHaveProperty('id');
  });
});
```

### Testing Authentication

```typescript
// Sign in and get auth cookie
const signInResponse = await request(app.getHttpServer())
  .post('/auth/sign-in')
  .send({ email: 'user@example.com', password: 'password123' })
  .expect(200);

const cookies = signInResponse.headers['set-cookie'];
const authCookie = cookies.find((cookie: string) =>
  cookie.startsWith('auth_token='),
);

// Use auth cookie in subsequent requests
const protectedResponse = await request(app.getHttpServer())
  .get('/protected-route')
  .set('Cookie', authCookie)
  .expect(200);
```

### Database Assertions

```typescript
import { User } from '@/domain/entities/user';

// Check if entity was created
const userRepository = dataSource.getRepository(User);
const user = await userRepository.findOne({
  where: { email: 'test@example.com' },
});
expect(user).toBeTruthy();

// Verify database is clean
const count = await userRepository.count();
expect(count).toBe(0);
```

## Best Practices

### 1. Test Isolation

- Each test starts with a clean database
- Tests should not depend on each other
- Use `beforeEach` and `afterEach` for cleanup

### 2. Realistic Test Data

- Use realistic data that matches your validation rules
- Test both valid and invalid scenarios
- Test edge cases and boundary conditions

### 3. Complete User Flows

- Test end-to-end user journeys
- Include authentication flows
- Test error scenarios

### 4. Database Verification

- Always verify database state changes
- Check both positive and negative cases
- Ensure proper data relationships

## Troubleshooting

### Common Issues

1. **Connection Timeout**

   - Increase timeout in Jest config
   - Check database connection parameters

2. **Database Already Exists Error**

   - The setup handles this automatically
   - Ensure proper cleanup in `afterAll`

3. **Port Already in Use**

   - Tests use the same app instance
   - Only one test database connection per test suite

4. **Authentication Issues**
   - Verify cookie extraction
   - Check authentication middleware setup

### Database Cleanup

If tests fail and leave the database dirty:

```sql
-- Connect to MySQL and run:
DROP DATABASE IF EXISTS abnmo_test_test_e2e;
```

## Architecture

### Test Database Strategy

Instead of using MySQL schemas (which are equivalent to databases in MySQL), this setup:

1. Creates a separate test database (`{original}_test_e2e`)
2. Uses TypeORM's `synchronize: true` for test database
3. Clears all tables between tests
4. Drops test database after all tests complete

### Database Module Override

The `DatabaseModule` automatically detects test environment and uses test configuration:

- **Development/Production**: Regular database with migrations
- **Test**: Test database with schema synchronization

This ensures tests run against the correct database structure without affecting development data.

## Security Notes

- Test environment variables use dummy values for secrets
- Test database should be separate from production
- Never run E2E tests against production database
- Test credentials should not be used in production

## Performance

- Tests run with `maxWorkers: 1` to prevent database conflicts
- Connection pooling is reduced in test environment
- Database cleanup is optimized to be fast but thorough
