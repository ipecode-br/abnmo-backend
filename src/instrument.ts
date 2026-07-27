import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;
const sentryLogs = process.env.SENTRY_LOGS;

interface HttpException {
  getStatus?: () => number;
}

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV,
    enableLogs: sentryLogs === 'all' || sentryLogs === 'error',
    beforeSend(event, hint) {
      const ex = hint?.originalException as HttpException | undefined;
      if (ex && typeof ex.getStatus === 'function') {
        const status = ex.getStatus();
        if (status && status < 500) return null;
      }
      return event;
    },
    beforeSendLog(log) {
      if (sentryLogs === 'none') {
        return null;
      }

      if (sentryLogs === 'error') {
        return log.level === 'error' ? log : null;
      }

      return log;
    },
  });
}
