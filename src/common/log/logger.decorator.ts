import { AppLogger } from './logger.service';

interface WithLogger {
  logger?: AppLogger;
  execute(...args: any[]): any;
}

export function Logger(): ClassDecorator {
  return (target: any): any => {
    const cls = target as { name: string; prototype: any };

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    const originalExecute = cls.prototype.execute as (...args: any[]) => any;

    if (typeof originalExecute !== 'function') {
      return target;
    }

    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
    cls.prototype.execute = function (this: WithLogger, ...args: unknown[]) {
      if (this.logger instanceof AppLogger) {
        this.logger.setContext(cls.name);
      }

      // eslint-disable-next-line @typescript-eslint/no-unsafe-return
      return originalExecute.apply(this, args);
    };

    return target;
  };
}
