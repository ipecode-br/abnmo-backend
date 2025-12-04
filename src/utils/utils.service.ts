import { Injectable } from '@nestjs/common';
import { startOfMonth, startOfWeek, startOfYear } from 'date-fns';
import { type CookieOptions, Response } from 'express';

import type { PeriodType } from '@/domain/schemas/query';
import { EnvService } from '@/env/env.service';

type SetCookieOptions = CookieOptions & {
  name: string;
  value: string;
};

@Injectable()
export class UtilsService {
  constructor(private readonly envService: EnvService) {}

  setCookie(
    response: Response,
    { name, value, ...options }: SetCookieOptions,
  ): void {
    const cookieDomain = this.envService.get('COOKIE_DOMAIN');

    response.cookie(name, value, {
      domain: `.${cookieDomain}`,
      httpOnly: true,
      maxAge: 1000 * 60 * 60 * 12, // 8 hours
      path: '/',
      sameSite: 'lax',
      secure: true,
      signed: true,
      ...options,
    });
  }

  deleteCookie(
    response: Response,
    name: string,
    options?: CookieOptions,
  ): void {
    const cookieDomain = this.envService.get('COOKIE_DOMAIN');

    response.clearCookie(name, {
      domain: `.${cookieDomain}`,
      httpOnly: true,
      path: '/',
      sameSite: 'lax',
      secure: true,
      signed: true,
      ...options,
    });
  }

  getDateRangeForPeriod(period: PeriodType): {
    startDate: Date;
    endDate: Date;
  } {
    const today = new Date();

    const periodMapper = {
      'last-week': {
        startDate: startOfWeek(today),
        endDate: today,
      },
      'last-month': {
        startDate: startOfMonth(today),
        endDate: today,
      },
      'last-year': {
        startDate: startOfYear(today),
        endDate: today,
      },
      today: {
        startDate: today,
        endDate: today,
      },
    };

    return periodMapper[period];
  }
}
