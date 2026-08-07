import * as Sentry from '@sentry/nestjs';

const dsn = process.env.SENTRY_DSN;
const sentryLogs = process.env.SENTRY_LOGS;

if (dsn) {
  Sentry.init({
    dsn,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV,
    enableLogs: sentryLogs === 'all' || sentryLogs === 'error',
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
