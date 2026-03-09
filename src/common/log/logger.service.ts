import { Injectable } from '@nestjs/common';
import { PinoLogger } from 'nestjs-pino';

import { ContextService } from '../context/context.service';
import type { ContextEvent } from '../types';

@Injectable()
export class AppLogger {
  constructor(
    private readonly pino: PinoLogger,
    private readonly ctx: ContextService,
  ) {}

  setContext(name: string) {
    this.ctx.addContext({ context: name });
  }

  setEvent(event: ContextEvent) {
    this.ctx.setEvent(event);
  }

  resetEvent() {
    this.ctx.resetEvent();
  }

  private buildPayload(extras: Record<string, any> = {}) {
    const context = this.ctx.getContext();

    if (context.extras) Object.assign(extras, context.extras);

    return { event: context.event, ...extras, authUser: context.authUser };
  }

  info(message: string, extras?: Record<string, any>) {
    this.pino.info(this.buildPayload(extras), message);
  }

  debug(message: string, extras?: Record<string, any>) {
    this.pino.debug(this.buildPayload(extras), message);
  }

  warn(message: string, extras?: Record<string, any>) {
    this.pino.warn(this.buildPayload(extras), message);
  }

  error(message: string | object, extras?: Record<string, any>) {
    // allow passing an object directly (exception payloads)
    if (typeof message === 'string') {
      this.pino.error(this.buildPayload(extras), message);
    } else {
      this.pino.error(this.buildPayload({ ...(extras ?? {}), ...{ message } }));
    }
  }

  /**
   * Generic alias matching Nest's `logger.log` signature.
   */
  log(message: string, extras?: Record<string, any>) {
    this.info(message, extras);
  }
}
