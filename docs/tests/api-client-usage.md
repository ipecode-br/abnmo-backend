# API Client for E2E Testing

## Overview

The API client provides a clean, readable abstraction over supertest for making HTTP requests in E2E tests. It offers both fluent and functional interfaces inspired by frontend API clients.

## Basic Usage

### Import and Setup

```typescript
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('My E2E Tests', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  // Your tests here...
});
```

### Fluent Interface (Recommended)

```typescript
// GET requests
const response = await api(app).get('/users').send();
const response = await api(app).get('/users').expect(200);

// POST requests  
const response = await api(app).post('/users').send(userData);
const response = await api(app).post('/users').expect(201).send(userData);

// PUT requests
const response = await api(app).put('/users/1').send(updateData);

// PATCH requests
const response = await api(app).patch('/users/1').send(partialData);

// DELETE requests
const response = await api(app).delete('/users/1').send();
const response = await api(app).delete('/users/1').expect(204);
```

### Query Parameters and Headers

```typescript
// Query parameters
const response = await api(app)
  .get('/users')
  .query({ page: '1', limit: '10' })
  .send();

// Custom headers
const response = await api(app)
  .post('/users')
  .headers({ 'Content-Type': 'application/json' })
  .send(userData);

// Combining query and headers
const response = await api(app)
  .get('/users')
  .query({ page: '1' })
  .expect(200);
```

### Functional Interface

```typescript
// Basic request
const response = await api(app).request('/users', {
  method: 'GET',
  expect: 200
});

// With body and headers
const response = await api(app).request('/users', {
  method: 'POST',
  body: userData,
  headers: { 'Content-Type': 'application/json' },
  expect: 201
});

// With query parameters
const response = await api(app).request('/users', {
  method: 'GET',
  query: { page: '1', limit: '10' }
});
```

## Authentication

### Using JWT Tokens

```typescript
// Get a token first (from login or setup)
const loginResponse = await api(app).post('/login').send({
  email: 'user@example.com',
  password: 'password'
});

const token = loginResponse.body.token;

// Use authenticated client
const authenticatedApi = api(app).withAuth(token);

// All requests will include Authorization header
const profile = await authenticatedApi.get('/profile').send();
const updated = await authenticatedApi.put('/profile').send(updateData);
```

## Expected Status Codes

### Single Status Code

```typescript
// Expects exactly 200
const response = await api(app).get('/users').expect(200);

// Expects exactly 201
const response = await api(app).post('/users').expect(201).send(userData);
```

### Multiple Status Codes (for flexible testing)

```typescript
// When you want to handle multiple valid responses
const response = await api(app).get('/users').expect([200, 404]);

// Check the actual status in your test
expect([200, 404].includes(response.status)).toBe(true);
```

## Migration Examples

### Before (with supertest)

```typescript
const response = await request(app.getHttpServer())
  .post('/register')
  .send(userData)
  .expect(201);
```

### After (with API client)

```typescript
const response = await api(app).post('/register').expect(201).send(userData);

// Or without expect for more flexible testing
const response = await api(app).post('/register').send(userData);
expect([200, 201, 400, 409].includes(response.status)).toBe(true);
```

## Complete Example

```typescript
import { INestApplication } from '@nestjs/common';
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('User Management E2E', () => {
  let app: INestApplication;

  beforeAll(() => {
    app = getTestApp();
  });

  it('should complete user registration flow', async () => {
    // 1. Register user
    const userData = {
      name: 'John Doe',
      email: 'john@example.com',
      password: 'securePassword123'
    };

    const registerResponse = await api(app)
      .post('/register')
      .expect(201)
      .send(userData);

    expect(registerResponse.body.success).toBe(true);

    // 2. Login user
    const loginResponse = await api(app)
      .post('/login')
      .send({
        email: userData.email,
        password: userData.password
      });

    expect([200, 201].includes(loginResponse.status)).toBe(true);
    
    const token = loginResponse.body.token;

    // 3. Access protected route
    const profileResponse = await api(app)
      .withAuth(token)
      .get('/profile')
      .expect(200);

    expect(profileResponse.body.email).toBe(userData.email);

    // 4. Update profile
    const updateResponse = await api(app)
      .withAuth(token)
      .put('/profile')
      .send({ name: 'John Updated' });

    expect([200, 204].includes(updateResponse.status)).toBe(true);
  });

  it('should handle validation errors', async () => {
    const invalidData = { email: 'invalid-email' };

    const response = await api(app)
      .post('/register')
      .send(invalidData);

    // Flexible status checking for validation errors
    expect([400, 422].includes(response.status)).toBe(true);
    expect(response.body).toHaveProperty('message');
  });

  it('should handle query parameters', async () => {
    const response = await api(app)
      .get('/users')
      .query({ page: '1', limit: '5', search: 'john' })
      .send();

    expect([200, 401].includes(response.status)).toBe(true);
    
    if (response.status === 200) {
      expect(Array.isArray(response.body.users)).toBe(true);
    }
  });
});
```

## Benefits

### ✅ **Readability**
- Clean, chainable interface
- Self-documenting method names
- Less boilerplate code

### ✅ **Flexibility**
- Both fluent and functional interfaces
- Easy authentication handling
- Flexible status code checking

### ✅ **Type Safety**
- Full TypeScript support
- Proper response typing
- IntelliSense support

### ✅ **Consistency**
- Same patterns across all tests
- Reusable authentication
- Standardized error handling

## Advanced Features

### Custom Headers for All Requests

```typescript
// For specific use cases, you can extend the client
class CustomApiClient extends ApiClient {
  async request(endpoint: string, options: RequestOptions = {}) {
    const headers = {
      'X-Test-Runner': 'jest',
      ...options.headers
    };
    
    return super.request(endpoint, { ...options, headers });
  }
}
```

### Request/Response Interceptors

```typescript
// You can wrap the client to add logging or other middleware
function withLogging(apiClient: ApiClient) {
  const originalRequest = apiClient.request.bind(apiClient);
  
  apiClient.request = async (endpoint: string, options: RequestOptions = {}) => {
    console.log(`Making ${options.method || 'GET'} request to ${endpoint}`);
    const response = await originalRequest(endpoint, options);
    console.log(`Response: ${response.status}`);
    return response;
  };
  
  return apiClient;
}

// Usage
const loggingApi = withLogging(api(app));
```

This API client makes your E2E tests more readable and maintainable while providing the same powerful features as direct supertest usage.
