import { createHmac } from 'node:crypto';

import { UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { SignatureMiddleware } from '@/common/middlewares/signature.middleware';
import { EnvService } from '@/env/env.service';

describe('SignatureMiddleware', () => {
  let middleware: SignatureMiddleware;
  let envService: MockProxy<EnvService>;

  const SECRET = 'clicksign-webhook-secret';
  const body = JSON.stringify({ event: { name: 'auto_close' }, document: {} });
  const rawBody = Buffer.from(body);

  beforeEach(async () => {
    envService = mock<EnvService>();
    envService.get.mockReturnValue(SECRET);

    const module = await Test.createTestingModule({
      providers: [
        SignatureMiddleware,
        { provide: EnvService, useValue: envService },
      ],
    }).compile();

    middleware = module.get(SignatureMiddleware);
  });

  const makeValidHmac = (payload: string) => {
    return `sha256=${createHmac('sha256', SECRET).update(payload).digest('hex')}`;
  };

  it('throws if content-hmac header is missing', () => {
    const req = { headers: {}, rawBody } as any;
    const next = jest.fn();

    expect(() => middleware.use(req, {} as any, next)).toThrow(
      UnauthorizedException,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('throws if rawBody is missing', () => {
    const req = {
      headers: { 'content-hmac': makeValidHmac(body) },
      rawBody: undefined,
    } as any;
    const next = jest.fn();

    expect(() => middleware.use(req, {} as any, next)).toThrow(
      UnauthorizedException,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('throws if HMAC does not match', () => {
    const req = {
      headers: {
        'content-hmac':
          'sha256=0000000000000000000000000000000000000000000000000000000000000000',
      },
      rawBody,
    } as any;
    const next = jest.fn();

    expect(() => middleware.use(req, {} as any, next)).toThrow(
      UnauthorizedException,
    );
    expect(next).not.toHaveBeenCalled();
  });

  it('calls next when HMAC is valid', () => {
    const req = {
      headers: { 'content-hmac': makeValidHmac(body) },
      rawBody,
    } as any;
    const next = jest.fn();

    middleware.use(req, {} as any, next);

    expect(next).toHaveBeenCalled();
  });
});
