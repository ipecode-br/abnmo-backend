export function getSentryConfig(
  overrides?: Record<string, unknown>,
): Record<string, unknown> | null {
  const sentryLogs = process.env.SENTRY_LOGS ?? 'none';
  const dsn = (overrides?.dsn as string | undefined) ?? process.env.SENTRY_DSN;

  if (!dsn) return null;

  return {
    dsn,
    tracesSampleRate: 0,
    environment: process.env.NODE_ENV,
    enableLogs: sentryLogs === 'all' || sentryLogs === 'error',
    beforeSendLog(log: { level: string }) {
      if (sentryLogs === 'none') {
        return null;
      }

      if (sentryLogs === 'error') {
        return log.level === 'error' ? log : null;
      }

      return log;
    },
    ...overrides,
  };
}
