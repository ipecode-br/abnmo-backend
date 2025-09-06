# Role-Based Authentication in E2E Tests

This document explains how to use the enhanced API client for testing protected routes with different user roles.

## Overview

The ABNMO backend uses role-based access control with 5 different user roles:

- `admin` - Full system access
- `manager` - Management-level access
- `nurse` - Healthcare provider access
- `specialist` - Specialist healthcare provider access
- `patient` - Patient-level access (default for registration)

## Problem

The standard `/register` endpoint only creates users with the `patient` role. Many routes require elevated permissions (`manager`, `nurse`, etc.), making it difficult to test these endpoints.

## Solution

The enhanced API client provides methods to create users with any role directly in the database, bypassing the registration endpoint limitations.

## Usage

### Basic Usage

```typescript
import { api } from '../config/api-client';

describe('Protected Route Tests', () => {
  it('should test with specific role', async () => {
    // Create and login as a manager
    const client = await api().createManagerAndLogin();

    // Now you can make authenticated requests
    const response = await client.get('/protected-endpoint').send();
    expect(response.status).toBe(200);
  });
});
```

### Available Methods

#### Role-Specific Convenience Methods

```typescript
// Create users with specific roles
await api().createAdminAndLogin(); // Admin user
await api().createManagerAndLogin(); // Manager user
await api().createNurseAndLogin(); // Nurse user
await api().createSpecialistAndLogin(); // Specialist user
await api().createPatientAndLogin(); // Patient user (same as createUserAndLogin)
```

#### Generic Role Method

```typescript
// Create user with any role
await api().createUserWithRoleAndLogin('nurse', {
  name: 'Custom Nurse',
  email: 'nurse@example.com',
  password: 'custom123',
});
```

#### Customizing User Data

All methods accept optional user data:

```typescript
await api().createManagerAndLogin({
  name: 'Test Manager',
  email: 'manager@example.com',
  password: 'securepassword123',
});
```

If no data is provided, defaults are generated:

- `name`: "Test {role} {timestamp}"
- `email`: "test-{role}-{timestamp}@example.com"
- `password`: "password123"

## Testing Different Permission Levels

### Example: Testing Patients Endpoint

```typescript
describe('GET /patients', () => {
  it('should deny access for patient role', async () => {
    const client = await api().createPatientAndLogin();
    await client.get('/patients').expect(401); // Returns 401 for insufficient permissions
  });

  it('should allow access for manager role', async () => {
    const client = await api().createManagerAndLogin();
    await client.get('/patients').expect(200);
  });

  it('should allow access for nurse role', async () => {
    const client = await api().createNurseAndLogin();
    await client.get('/patients').expect(200);
  });

  it('should deny access for specialist role', async () => {
    const client = await api().createSpecialistAndLogin();
    await client.get('/patients').expect(401); // Returns 401 for insufficient permissions
  });
});
```

## Best Practices

### 1. Test All Permission Levels

For each protected endpoint, test:

- Unauthenticated access (should return 401)
- Each role that should have access (should return 2xx)
- Each role that should NOT have access (should return 401 - insufficient permissions)

```typescript
describe('Protected Endpoint', () => {
  it('should return 401 for unauthenticated requests', async () => {
    await api().get('/protected').expect(401);
  });

  it('should return 401 for insufficient permissions', async () => {
    const client = await api().createPatientAndLogin();
    await client.get('/protected').expect(401);
  });

  it('should allow access for authorized roles', async () => {
    const client = await api().createManagerAndLogin();
    await client.get('/protected').expect(200);
  });
});
```

### 2. Use Unique Emails for Creation Tests

When testing creation endpoints, ensure unique emails to avoid conflicts:

```typescript
it('should create resource', async () => {
  const client = await api().createManagerAndLogin();
  const uniqueData = {
    name: 'Test Resource',
    email: `test-${Date.now()}@example.com`, // Unique email
  };

  await client.post('/resources').send(uniqueData).expect(201);
});
```

### 3. Group Tests by Permission Level

Organize tests to clearly show which roles can access which endpoints:

```typescript
describe('Manager-only endpoints', () => {
  let managerClient: AuthenticatedApiClient;

  beforeAll(async () => {
    managerClient = await api().createManagerAndLogin();
  });

  it('should access manager dashboard', async () => {
    await managerClient.get('/manager/dashboard').expect(200);
  });

  it('should manage users', async () => {
    await managerClient.get('/manager/users').expect(200);
  });
});
```

## Behind the Scenes

The role-based authentication helper:

1. **Creates users directly in database** - Bypasses registration endpoint limitations
2. **Hashes passwords properly** - Uses bcrypt with salt rounds matching the app
3. **Logs in automatically** - Gets authentication cookie for immediate use
4. **Returns authenticated client** - Ready to make protected requests

## Troubleshooting

### Common Issues

**401 Unauthorized**: The user doesn't have permission for this endpoint.

- Check the endpoint's role requirements
- Ensure you're using the correct role for testing

**409 Conflict**: Resource already exists (e.g., duplicate email, CPF).

- Use unique identifiers for creation tests
- Clear test database between runs if needed

### Debugging Authentication

```typescript
it('should debug authentication', async () => {
  const client = await api().createManagerAndLogin({
    email: 'debug@example.com',
  });

  // Test authentication works
  const profileResponse = await client.get('/users/profile').send();
  expect(profileResponse.status).toBe(200);

  // Now test your actual endpoint
  const response = await client.get('/your-endpoint').send();
  console.log('Response status:', response.status);
  console.log('Response body:', response.body);
});
```

## Integration with Existing Tests

The new methods are fully compatible with existing test patterns. You can gradually migrate tests or use both approaches:

```typescript
// Old way (still works for patient role)
const oldClient = await api().createUserAndLogin({
  name: 'Test User',
  email: 'test@example.com',
  password: 'password123',
});

// New way (works for any role)
const newClient = await api().createManagerAndLogin();
```
