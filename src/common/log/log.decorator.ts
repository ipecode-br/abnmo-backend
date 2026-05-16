import 'reflect-metadata';

import type { ContextEvent } from '../types';
import { LogService } from './log.service';

interface WithLogger {
  logger?: LogService;
  execute(...args: any[]): any;
}

export const LOGGER_EVENT_KEY = 'LOGGER_EVENT_KEY';

export function Log(eventName?: ContextEvent) {
  return (
    target: any,
    propertyKey?: string,
    descriptor?: PropertyDescriptor,
  ): any => {
    // Method decorator usage (on controller methods)
    if (descriptor && propertyKey) {
      Reflect.defineMetadata(
        LOGGER_EVENT_KEY,
        eventName,
        descriptor.value as object,
      );
      return descriptor;
    }

    // Class decorator usage (on classes / use-cases)
    const cls = target as { name: string; prototype: any };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const execute = cls.prototype.execute as (...args: any[]) => any;

    if (typeof execute !== 'function') {
      return target;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    cls.prototype.execute = function (this: WithLogger, ...args: unknown[]) {
      if (this.logger instanceof LogService) {
        this.logger.setContext(cls.name);

        if (eventName) {
          this.logger.setEvent(eventName);
        }
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return execute.apply(this, args);
    };

    return target;
  };
}
