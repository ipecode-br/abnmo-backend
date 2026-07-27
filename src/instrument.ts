import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;

interface HttpExceptionLike {
  getStatus?: () => number;
}

if (dsn) {
  Sentry.init({
    dsn,
    environment: process.env.NODE_ENV,
    enableLogs: process.env.SENTRY_ENABLE_LOGS === 'true',
    tracesSampleRate: 0,
    beforeSend(event, hint) {
      const ex = hint?.originalException as HttpExceptionLike | undefined;
      if (ex && typeof ex.getStatus === 'function') {
        const status = ex.getStatus();
        if (status && status < 500) return null;
      }
      return event;
    },
  });
}
