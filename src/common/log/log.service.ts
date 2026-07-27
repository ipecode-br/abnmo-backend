import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';
import { PinoLogger } from 'nestjs-pino';

import { Env } from '@/env/env';
import { EnvService } from '@/env/env.service';

import { ContextService } from '../context/context.service';
import type { ContextEvent, ContextUser } from '../types';

@Injectable()
export class LogService {
  private readonly sentryLogs: Env['SENTRY_LOGS'];

  constructor(
    private readonly env: EnvService,
    private readonly pino: PinoLogger,
    private readonly ctx: ContextService,
  ) {
    this.sentryLogs = this.env.get('SENTRY_LOGS');
  }

  setContext(name: string) {
    this.ctx.addContext({ context: name });
  }

  setEvent(event: ContextEvent) {
    this.ctx.setEvent(event);
  }

  resetEvent() {
    this.ctx.resetEvent();
  }

  setUser(user: ContextUser) {
    this.ctx.setUser(user);
  }

  info(message: string, extras?: Record<string, any>) {
    this.pino.info(this.buildPayload(extras), message);
    if (this.sentryLogs === 'all') {
      Sentry.logger.info(message, extras);
    }
  }

  debug(message: string, extras?: Record<string, any>) {
    this.pino.debug(this.buildPayload(extras), message);
    if (this.sentryLogs === 'all') {
      Sentry.logger.debug(message, extras);
    }
  }

  warn(message: string, extras?: Record<string, any>) {
    this.pino.warn(this.buildPayload(extras), message);
    if (this.sentryLogs === 'all') {
      Sentry.logger.warn(message, extras);
    }
  }

  error(message: string | object, extras?: Record<string, any>) {
    if (typeof message === 'string') {
      this.pino.error(this.buildPayload(extras), message);
      if (this.sentryLogs === 'all' || this.sentryLogs === 'error') {
        Sentry.logger.error(message, extras);
      }
    } else {
      this.pino.error(this.buildPayload({ ...(extras ?? {}), ...{ message } }));
      if (this.sentryLogs === 'all' || this.sentryLogs === 'error') {
        Sentry.logger.error('Error', {
          ...(extras ?? {}),
          ...(message as Record<string, any>),
        });
      }
    }
  }

  log(message: string, extras?: Record<string, any>) {
    this.info(message, extras);
    if (this.sentryLogs === 'all') {
      Sentry.logger.info(message, extras);
    }
  }

  private buildPayload(extras: Record<string, any> = {}) {
    const context = this.ctx.getContext();

    if (context.extras) Object.assign(extras, context.extras);

    return { event: context.event, user: context.user, ...extras };
  }
}
