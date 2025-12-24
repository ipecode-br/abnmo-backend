import { INestApplication } from '@nestjs/common';
import { hash } from 'bcryptjs';
import request, { Response } from 'supertest';

import { User } from '@/domain/entities/user';
import type { UserRole } from '@/domain/enums/users';

import { getTestApp, getTestDataSource } from './setup';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  expect?: number | number[];
}

// User cache for better performance
interface CachedUser {
  email: string;
  password: string;
  role: UserRole;
  id: string;
  createdAt: number;
}

class UserCache {
  private static cache = new Map<UserRole, CachedUser>();
  private static cacheTimeout = 30000; // 30 seconds cache

  static async getOrCreateUser(role: UserRole): Promise<CachedUser> {
    const now = Date.now();
    const cached = this.cache.get(role);

    // Return cached user if valid and not expired
    if (cached && now - cached.createdAt < this.cacheTimeout) {
      // Verify user still exists in database
      try {
        const dataSource = getTestDataSource();
        const userRepository = dataSource.getRepository(User);
        const existingUser = await userRepository.findOne({
          where: { id: cached.id },
        });
        if (existingUser) {
          return cached;
        }
      } catch {
        // If verification fails, remove from cache and create new
      }
    }

    // Create new user
    const dataSource = getTestDataSource();
    const userRepository = dataSource.getRepository(User);

    const timestamp = Date.now();
    const email = `test-${role}-${timestamp}@example.com`;
    const password = 'password123';
    const hashedPassword = await hash(password, 10);

    const user = userRepository.create({
      name: `Test ${role} ${timestamp}`,
      email,
      password: hashedPassword,
      role,
    });

    const savedUser = await userRepository.save(user);

    const cachedUser: CachedUser = {
      email,
      password,
      role,
      id: savedUser.id,
      createdAt: now,
    };

    this.cache.set(role, cachedUser);
    return cachedUser;
  }

  static clear(): void {
    this.cache.clear();
  }
}

class ApiClient {
  private app: INestApplication;

  constructor(app?: INestApplication) {
    this.app = app || getTestApp();
  }

  // Main request method
  async request(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const method = options.method || 'GET';

    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const server = this.app.getHttpServer();

    // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
    let req = request(server)[method.toLowerCase() as 'get'](endpoint);

    // Add query parameters
    if (options.query) {
      req = req.query(options.query);
    }

    // Add headers
    if (options.headers) {
      req = req.set(options.headers);
    }

    // Add request body
    if (options.body) {
      req = req.send(options.body);
    }

    // Handle status expectations
    if (options.expect) {
      if (Array.isArray(options.expect)) {
        // For multiple expected statuses, don't use .expect()
        return req;
      } else {
        return req.expect(options.expect);
      }
    }

    return req;
  }

  // Fluent interface methods
  get(endpoint: string) {
    return {
      send: (body?: unknown) => this.request(endpoint, { method: 'GET', body }),
      query: (params: Record<string, string>) => ({
        send: (body?: unknown) =>
          this.request(endpoint, { method: 'GET', body, query: params }),
        expect: (status: number | number[]) =>
          this.request(endpoint, {
            method: 'GET',
            query: params,
            expect: status,
          }),
      }),
      headers: (headers: Record<string, string>) => ({
        send: (body?: unknown) =>
          this.request(endpoint, { method: 'GET', body, headers }),
        expect: (status: number | number[]) =>
          this.request(endpoint, { method: 'GET', headers, expect: status }),
      }),
      expect: (status: number | number[]) =>
        this.request(endpoint, { method: 'GET', expect: status }),
    };
  }

  post(endpoint: string) {
    return {
      send: (body: unknown) => this.request(endpoint, { method: 'POST', body }),
      headers: (headers: Record<string, string>) => ({
        send: (body: unknown) =>
          this.request(endpoint, { method: 'POST', body, headers }),
      }),
      expect: (status: number | number[]) => ({
        send: (body: unknown) =>
          this.request(endpoint, { method: 'POST', body, expect: status }),
      }),
    };
  }

  put(endpoint: string) {
    return {
      send: (body: unknown) => this.request(endpoint, { method: 'PUT', body }),
      headers: (headers: Record<string, string>) => ({
        send: (body: unknown) =>
          this.request(endpoint, { method: 'PUT', body, headers }),
      }),
      expect: (status: number | number[]) => ({
        send: (body: unknown) =>
          this.request(endpoint, { method: 'PUT', body, expect: status }),
      }),
    };
  }

  patch(endpoint: string) {
    return {
      send: (body: unknown) =>
        this.request(endpoint, { method: 'PATCH', body }),
      headers: (headers: Record<string, string>) => ({
        send: (body: unknown) =>
          this.request(endpoint, { method: 'PATCH', body, headers }),
      }),
      expect: (status: number | number[]) => ({
        send: (body: unknown) =>
          this.request(endpoint, { method: 'PATCH', body, expect: status }),
      }),
    };
  }

  delete(endpoint: string) {
    return {
      send: (body?: unknown) =>
        this.request(endpoint, { method: 'DELETE', body }),
      headers: (headers: Record<string, string>) => ({
        send: (body?: unknown) =>
          this.request(endpoint, { method: 'DELETE', body, headers }),
      }),
      expect: (status: number | number[]) =>
        this.request(endpoint, { method: 'DELETE', expect: status }),
    };
  }

  // Authentication helper - for cookie-based auth
  withCookie(cookieString: string): ApiClient {
    return new CookieAuthenticatedApiClient(this.app, cookieString);
  }

  // Helper method to login and get authenticated client
  async loginAs(credentials: {
    email: string;
    password: string;
    rememberMe?: boolean;
  }): Promise<AuthenticatedApiClient> {
    const loginResponse = await this.post('/login').send(credentials);

    if (loginResponse.status !== 201 && loginResponse.status !== 200) {
      throw new Error(
        `Login failed with status ${loginResponse.status}: ${JSON.stringify(
          loginResponse.body,
        )}`,
      );
    }

    // Extract authentication cookie
    const cookies = loginResponse.headers['set-cookie'] as unknown as string[];
    const authCookie = cookies?.find((cookie: string) =>
      cookie.startsWith('access_token='),
    );

    if (!authCookie) {
      throw new Error('No access token cookie found in login response');
    }

    return new AuthenticatedApiClient(this.app, authCookie);
  }

  // Helper method to create a test user and login
  async createUserAndLogin(userData: {
    name: string;
    email: string;
    password: string;
  }): Promise<AuthenticatedApiClient> {
    // Register the user
    const registerResponse = await this.post('/register').send(userData);

    // Handle both success and conflict (user already exists) cases
    if (
      registerResponse.status !== 201 &&
      registerResponse.status !== 200 &&
      registerResponse.status !== 409 // Handle existing user case
    ) {
      throw new Error(
        `Registration failed with status ${
          registerResponse.status
        }: ${JSON.stringify(registerResponse.body)}`,
      );
    }

    // If user already exists (409), that's fine, just login
    // Login with the user credentials
    return this.loginAs({
      email: userData.email,
      password: userData.password,
    });
  }

  /**
   * Creates a user with specific role directly in database and login
   * This bypasses the registration endpoint which only creates 'patient' users
   * Uses caching for better performance
   * @param role - User role to create
   * @param userData - Optional user data (defaults will be used if not provided)
   * @returns Authenticated API client for the created user
   */
  async createUserWithRoleAndLogin(
    role: UserRole,
    userData?: Partial<{
      name: string;
      email: string;
      password: string;
    }>,
  ): Promise<AuthenticatedApiClient> {
    // If no custom userData is provided, use cached user for better performance
    if (!userData) {
      const cachedUser = await UserCache.getOrCreateUser(role);
      return this.loginAs({
        email: cachedUser.email,
        password: cachedUser.password,
      });
    }

    // Create new user with custom data (no caching)
    const dataSource = getTestDataSource();
    const userRepository = dataSource.getRepository(User);

    // Generate unique email if not provided
    const timestamp = Date.now();
    const defaultUserData = {
      name: `Test ${role} ${timestamp}`,
      email: userData?.email || `test-${role}-${timestamp}@example.com`,
      password: userData?.password || 'password123',
    };

    const finalUserData = { ...defaultUserData, ...userData };

    // Hash the password
    const hashedPassword = await hash(finalUserData.password, 10);

    // Create user directly in database with the specified role
    const user = userRepository.create({
      name: finalUserData.name,
      email: finalUserData.email,
      password: hashedPassword,
      role,
    });

    await userRepository.save(user);

    // Login to get the authenticated client
    return this.loginAs({
      email: finalUserData.email,
      password: finalUserData.password,
    });
  }

  /**
   * Convenience method to create and login as admin user
   */
  async createAdminAndLogin(
    userData?: Partial<{ name: string; email: string; password: string }>,
  ): Promise<AuthenticatedApiClient> {
    return this.createUserWithRoleAndLogin('admin', userData);
  }

  /**
   * Convenience method to create and login as nurse user
   */
  async createNurseAndLogin(
    userData?: Partial<{ name: string; email: string; password: string }>,
  ): Promise<AuthenticatedApiClient> {
    return this.createUserWithRoleAndLogin('nurse', userData);
  }

  /**
   * Convenience method to create and login as specialist user
   */
  async createSpecialistAndLogin(
    userData?: Partial<{ name: string; email: string; password: string }>,
  ): Promise<AuthenticatedApiClient> {
    return this.createUserWithRoleAndLogin('specialist', userData);
  }

  /**
   * Convenience method to create and login as manager user
   */
  async createManagerAndLogin(
    userData?: Partial<{ name: string; email: string; password: string }>,
  ): Promise<AuthenticatedApiClient> {
    return this.createUserWithRoleAndLogin('manager', userData);
  }

  /**
   * Convenience method to create and login as patient user (default role)
   */
  // async createPatientAndLogin(
  //   userData?: Partial<{ name: string; email: string; password: string }>,
  // ): Promise<AuthenticatedApiClient> {
  //   return this.createUserWithRoleAndLogin('patient', userData);
  // }
}

class CookieAuthenticatedApiClient extends ApiClient {
  private cookieString: string;

  constructor(app: INestApplication, cookieString: string) {
    super(app);
    this.cookieString = cookieString;
  }

  // Override request method to include cookie authentication
  async request(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const headers = {
      Cookie: this.cookieString,
      ...options.headers,
    };

    return super.request(endpoint, { ...options, headers });
  }
}

class AuthenticatedApiClient extends CookieAuthenticatedApiClient {
  constructor(app: INestApplication, cookieString: string) {
    super(app, cookieString);
  }

  // Additional helper methods for authenticated requests
  async logout(): Promise<Response> {
    return this.post('/logout').send({});
  }
}

// Factory function for easy use
export function api(app?: INestApplication): ApiClient {
  return new ApiClient(app);
}

// Clear user cache - should be called when database is cleared
export function clearUserCache(): void {
  UserCache.clear();
}

// Export the classes for advanced usage
export { ApiClient, AuthenticatedApiClient, CookieAuthenticatedApiClient };

// Type exports
export type { HttpMethod, RequestOptions };
