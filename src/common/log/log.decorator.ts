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
    // Method decorator usage (on Controller methods)
    if (descriptor && propertyKey) {
      const targetForMetadata = descriptor.value as object;
      Reflect.defineMetadata(LOGGER_EVENT_KEY, eventName, targetForMetadata);
      return descriptor;
    }

    // Class decorator usage (on Classes / UseCases / Services)
    const cls = target as { name: string; prototype: any };
    const prototype = cls.prototype as Record<string, any>;
    const methods = Object.getOwnPropertyNames(prototype);

    for (const name of methods) {
      const originalMethod = prototype[name] as (...args: any[]) => any;

      prototype[name] = function (this: WithLogger, ...args: unknown[]) {
        if (this.logger instanceof LogService) {
          const context = name === 'execute' ? cls.name : `${cls.name}.${name}`;
          this.logger.setContext(context);

          if (eventName) {
            this.logger.setEvent(eventName);
          }
        }

        // eslint-disable-next-line @typescript-eslint/no-unsafe-return
        return originalMethod.apply(this, args);
      };
    }

    return target;
  };
}
