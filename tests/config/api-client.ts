import type { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import request from 'supertest';

export interface BaseResponseBody {
  success: boolean;
  message: string;
}

export interface ResponseBody<T> extends Omit<Response, 'body'> {
  body: T;
}

interface RequestOptions {
  cookies?: string[];
  headers?: Record<string, string>;
}

export type ApiClient = ReturnType<typeof createApiClient>;

export function createApiClient(app: INestApplication) {
  const httpServer = app.getHttpServer();

  async function send<T>(
    method: 'get' | 'post' | 'put' | 'patch' | 'delete',
    url: string,
    body?: unknown,
    options?: RequestOptions,
  ): Promise<ResponseBody<T>> {
    const req = request(httpServer)[method](url);

    if (options?.cookies) {
      req.set('Cookie', options.cookies);
    }

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        req.set(key, value);
      });
    }

    if (body !== undefined) {
      req.send(body as object);
    }

    return req;
  }

  async function getQuery<T>(
    url: string,
    queryParams?: Record<string, unknown>,
    options?: RequestOptions,
  ): Promise<ResponseBody<T>> {
    const req = request(httpServer)
      .get(url)
      .query(queryParams ?? {});

    if (options?.cookies) {
      req.set('Cookie', options.cookies);
    }

    if (options?.headers) {
      Object.entries(options.headers).forEach(([key, value]) => {
        req.set(key, value);
      });
    }

    return req;
  }

  return {
    get<T = BaseResponseBody>(
      url: string,
      queryParams?: Record<string, unknown>,
      options?: RequestOptions,
    ) {
      return getQuery<T>(url, queryParams, options);
    },

    post<T = BaseResponseBody, B = unknown>(
      url: string,
      body?: B,
      options?: RequestOptions,
    ) {
      return send<T>('post', url, body, options);
    },

    put<T = BaseResponseBody, B = unknown>(
      url: string,
      body?: B,
      options?: RequestOptions,
    ) {
      return send<T>('put', url, body, options);
    },

    patch<T = BaseResponseBody, B = unknown>(
      url: string,
      body?: B,
      options?: RequestOptions,
    ) {
      return send<T>('patch', url, body, options);
    },

    delete<T = BaseResponseBody>(url: string, options?: RequestOptions) {
      return send<T>('delete', url, undefined, options);
    },
  };
}
