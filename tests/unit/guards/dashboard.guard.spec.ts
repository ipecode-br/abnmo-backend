import { ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { IS_DASHBOARD_KEY } from '@/common/decorators/dashboard.decorator';
import { DashboardGuard } from '@/common/guards/dashboard.guard';
import { EnvService } from '@/env/env.service';

describe('DashboardGuard', () => {
  let guard: DashboardGuard;
  let reflector: MockProxy<Reflector>;
  let envService: MockProxy<EnvService>;

  beforeEach(async () => {
    reflector = mock<Reflector>();
    envService = mock<EnvService>();

    envService.get.mockReturnValue('my-secret-dashboard-key');

    const module = await Test.createTestingModule({
      providers: [
        DashboardGuard,
        { provide: Reflector, useValue: reflector },
        { provide: EnvService, useValue: envService },
      ],
    }).compile();

    guard = module.get(DashboardGuard);
  });

  const makeContext = (
    options: { dashboard?: boolean; dashboardKey?: string } = {},
  ): ExecutionContext => {
    reflector.getAllAndOverride.mockReturnValue(options.dashboard ?? false);

    const request = {
      headers: options.dashboardKey
        ? { 'x-dashboard-key': options.dashboardKey }
        : {},
    };

    return {
      switchToHttp: () => ({
        getRequest: () => request,
        getResponse: () => ({}),
      }),
      getHandler: () => ({}),
      getClass: () => ({}),
    } as unknown as ExecutionContext;
  };

  describe('Non-dashboard routes', () => {
    it('returns "true" without checking header', () => {
      const ctx = makeContext({ dashboard: false });
      const result = guard.canActivate(ctx);

      expect(result).toBe(true);
      expect(reflector.getAllAndOverride).toHaveBeenCalledWith(
        IS_DASHBOARD_KEY,
        [expect.anything(), expect.anything()],
      );
    });
  });

  describe('@Dashboard() routes', () => {
    it('returns "true" when dashboard key header matches', () => {
      const ctx = makeContext({
        dashboard: true,
        dashboardKey: 'my-secret-dashboard-key',
      });
      expect(guard.canActivate(ctx)).toBe(true);
    });

    it('throws "UnauthorizedException" when dashboard key header is missing', () => {
      const ctx = makeContext({ dashboard: true });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });

    it('throws "UnauthorizedException" when dashboard key header does not match', () => {
      const ctx = makeContext({ dashboard: true, dashboardKey: 'wrong-key' });
      expect(() => guard.canActivate(ctx)).toThrow(UnauthorizedException);
    });
  });
});
