interface GetSentryConfigProps {
  dsn: string;
  sentryLogs: string;
  environment?: string;
}

export function getSentryConfig({
  dsn,
  sentryLogs,
  environment,
}: GetSentryConfigProps): Record<string, unknown> | null {
  if (!dsn) return null;

  return {
    dsn,
    tracesSampleRate: 0,
    environment,
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
  };
}
