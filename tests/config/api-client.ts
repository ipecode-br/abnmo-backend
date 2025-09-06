import { INestApplication } from '@nestjs/common';
import request, { Response } from 'supertest';

import { getTestApp } from './setup';

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

interface RequestOptions {
  method?: HttpMethod;
  body?: unknown;
  headers?: Record<string, string>;
  query?: Record<string, string>;
  expect?: number | number[];
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

  // Authentication helper
  withAuth(token: string): ApiClient {
    return new AuthenticatedApiClient(this.app, token);
  }
}

class AuthenticatedApiClient extends ApiClient {
  private token: string;

  constructor(app: INestApplication, token: string) {
    super(app);
    this.token = token;
  }

  // Override request method to include authentication
  async request(
    endpoint: string,
    options: RequestOptions = {},
  ): Promise<Response> {
    const headers = {
      Authorization: `Bearer ${this.token}`,
      ...options.headers,
    };

    return super.request(endpoint, { ...options, headers });
  }
}

// Factory function for easy use
export function api(app?: INestApplication): ApiClient {
  return new ApiClient(app);
}

// Export the class for advanced usage
export { ApiClient };

// Type exports
export type { HttpMethod, RequestOptions };
