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
    const payload = this.buildPayload(extras);
    this.pino.info(payload, message);
    if (this.sentryLogs === 'all') {
      Sentry.logger.info(message, this.flattenForSentry(payload));
    }
  }

  debug(message: string, extras?: Record<string, any>) {
    const payload = this.buildPayload(extras);
    this.pino.debug(payload, message);
    if (this.sentryLogs === 'all') {
      Sentry.logger.debug(message, this.flattenForSentry(payload));
    }
  }

  warn(message: string, extras?: Record<string, any>) {
    const payload = this.buildPayload(extras);
    this.pino.warn(payload, message);
    if (this.sentryLogs === 'all') {
      Sentry.logger.warn(message, this.flattenForSentry(payload));
    }
  }

  error(message: string | object, extras?: Record<string, any>) {
    if (typeof message === 'string') {
      const payload = this.buildPayload(extras);
      this.pino.error(payload, message);
      if (this.sentryLogs === 'all' || this.sentryLogs === 'error') {
        Sentry.logger.error(message, this.flattenForSentry(payload));
      }
    } else {
      const payload = this.buildPayload({
        ...(extras ?? {}),
        ...(message as Record<string, any>),
      });
      this.pino.error(payload);
      if (this.sentryLogs === 'all' || this.sentryLogs === 'error') {
        Sentry.logger.error('Error', this.flattenForSentry(payload));
      }
    }
  }

  log(message: string, extras?: Record<string, any>) {
    this.info(message, extras);
  }

  private buildPayload(extras: Record<string, any> = {}) {
    const context = this.ctx.getContext();

    if (context.extras) Object.assign(extras, context.extras);

    return { event: context.event, user: context.user, ...extras };
  }

  private flattenForSentry(payload: Record<string, any>): Record<string, any> {
    const entries = Object.entries(payload as Record<string, unknown>);
    return Object.fromEntries(
      entries.map(([key, value]) => [
        key,
        Array.isArray(value) ? JSON.stringify(value) : value,
      ]),
    ) as Record<string, any>;
  }
}
