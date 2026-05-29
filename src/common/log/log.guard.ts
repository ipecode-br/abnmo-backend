import 'reflect-metadata';

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

import type { Event } from '../types';
import { LOGGER_EVENT_KEY } from './log.decorator';
import { LogService } from './log.service';

/**
 * Guard that applies @Logger event context early in the pipeline.
 *
 * Runs before pipes to ensure Zod validation errors have context/event set.
 */
@Injectable()
export class LogGuard implements CanActivate {
  constructor(private readonly logger: LogService) {}

  canActivate(context: ExecutionContext): boolean {
    const handler = context.getHandler();
    const targetClass = context.getClass();

    const eventName = Reflect.getMetadata(LOGGER_EVENT_KEY, handler) as
      | Event
      | undefined;

    if (eventName) {
      this.logger.setEvent(eventName);
      this.logger.setContext(targetClass.name);
    }

    return true;
  }
}
