# Authentication Helpers for E2E Tests

This document explains how to use the authentication helpers to simplify e2e tests for protected routes.

## Overview

The ABNMO platform uses **cookie-based authentication** with an `access_token` cookie. The authentication helpers provide convenient methods to handle login, registration, and authenticated requests without repeating the authentication flow in every test.

## Available Methods

### Basic API Client

```typescript
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

// Create basic API client
const apiClient = api(app);
```

### Authentication Methods

#### 1. `loginAs(credentials)` - Login with existing credentials

```typescript
const authenticatedApi = await api(app).loginAs({
  email: 'user@example.com',
  password: 'password123',
  rememberMe: false, // optional
});

// Now make authenticated requests
const response = await authenticatedApi.get('/users/profile').send();
```

#### 2. `createUserAndLogin(userData)` - Register and auto-login

```typescript
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'TestPassword123!',
};

const authenticatedApi = await api(app).createUserAndLogin(testUser);

// User is now registered and logged in
const response = await authenticatedApi.get('/users/profile').send();
```

#### 3. `withCookie(cookieString)` - Use existing cookie

```typescript
// If you already have an auth cookie
const authenticatedApi = api(app).withCookie('access_token=jwt_token_here');

const response = await authenticatedApi.get('/protected-route').send();
```

### Test User Generation

Use `AuthTestHelpers` to generate unique test users:

```typescript
import { AuthTestHelpers } from '../config/test-utils';

// Generate a single test user with unique email
const testUser = AuthTestHelpers.generateTestUser('my-test');
// Result: { name: 'Test User 1234567890', email: 'my-test-1234567890-123@example.com', password: 'TestPassword123!' }

// Generate multiple test users
const testUsers = AuthTestHelpers.generateTestUsers(3, 'batch-test');
// Results in array of 3 users with unique emails
```

## Usage Examples

### Testing Protected Routes

```typescript
describe('Protected Routes', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('should require authentication', async () => {
    // Test without authentication
    const response = await api(app).get('/users/profile').send();

    expect(response.status).toBe(401);
    expect(response.body).toHaveProperty('message');
    expect((response.body as { message: string }).message).toContain(
      'Token de acesso ausente.',
    );
  });

  it('should allow authenticated access', async () => {
    // Create and login user
    const testUser = AuthTestHelpers.generateTestUser('profile-test');
    const authenticatedApi = await api(app).createUserAndLogin(testUser);

    // Access protected route
    const response = await authenticatedApi.get('/users/profile').send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('success', true);
    expect(response.body.data).toMatchObject({
      email: testUser.email,
      name: testUser.name,
    });
  });
});
```

### Testing Different User Roles

```typescript
describe('Role-based Access', () => {
  it('should test with multiple users', async () => {
    // Create multiple test users
    const users = AuthTestHelpers.generateTestUsers(2, 'role-test');

    // Login each user and test
    for (const user of users) {
      const authenticatedApi = await api(app).createUserAndLogin(user);

      const response = await authenticatedApi.get('/some-endpoint').send();

      // Test based on expected behavior for this user
      expect([200, 403].includes(response.status)).toBe(true);
    }
  });
});
```

### Testing with Existing Users

```typescript
describe('Existing User Tests', () => {
  it('should login with known credentials', async () => {
    // First create a user (could be in beforeAll)
    const userData = AuthTestHelpers.generateTestUser('known-user');
    await api(app).post('/register').send(userData);

    // Later, login with those credentials
    const authenticatedApi = await api(app).loginAs({
      email: userData.email,
      password: userData.password,
    });

    const response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(200);
  });
});
```

### Logout Testing

```typescript
describe('Logout', () => {
  it('should logout user', async () => {
    const testUser = AuthTestHelpers.generateTestUser('logout-test');
    const authenticatedApi = await api(app).createUserAndLogin(testUser);

    // User is authenticated
    let response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(200);

    // Logout
    await authenticatedApi.logout();

    // Try to access protected route after logout
    response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(401);
  });
});
```

## Error Handling

The authentication helpers throw descriptive errors when authentication fails:

```typescript
try {
  const authenticatedApi = await api(app).loginAs({
    email: 'invalid@example.com',
    password: 'wrongpassword',
  });
} catch (error) {
  // Error will include response status and body
  console.error('Login failed:', error.message);
}
```

## Best Practices

1. **Use unique test users**: Always use `AuthTestHelpers.generateTestUser()` to avoid conflicts between tests.

2. **Test both authenticated and unauthenticated scenarios**: Always test that routes properly reject unauthenticated requests.

3. **Clean database between tests**: Use the database clearing utilities for isolation when needed.

4. **Avoid shared authentication state**: Create fresh authenticated clients for each test to avoid side effects.

5. **Test error scenarios**: Include tests for invalid credentials, expired tokens, etc.

## Common Patterns

```typescript
// Pattern 1: Test unauthenticated first, then authenticated
it('should handle endpoint properly', async () => {
  // Test without auth
  let response = await api(app).get('/endpoint').send();
  expect(response.status).toBe(401);

  // Test with auth
  const authenticatedApi = await api(app).createUserAndLogin(
    AuthTestHelpers.generateTestUser('test'),
  );
  response = await authenticatedApi.get('/endpoint').send();
  expect(response.status).toBe(200);
});

// Pattern 2: Reuse authenticated client in describe block
describe('User Management', () => {
  let authenticatedApi: AuthenticatedApiClient;

  beforeAll(async () => {
    const testUser = AuthTestHelpers.generateTestUser('user-mgmt');
    authenticatedApi = await api(app).createUserAndLogin(testUser);
  });

  it('should get profile', async () => {
    const response = await authenticatedApi.get('/users/profile').send();
    expect(response.status).toBe(200);
  });

  it('should update profile', async () => {
    const response = await authenticatedApi.put('/users/profile').send({
      name: 'Updated Name',
    });
    expect([200, 400].includes(response.status)).toBe(true);
  });
});
```
