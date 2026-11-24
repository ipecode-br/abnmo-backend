interface GetSentryConfigProps {
  dsn: string;
  sentryLogs: string;
  component: string;
  environment?: string;
}

export function getSentryConfig({
  dsn,
  sentryLogs,
  component,
  environment,
}: GetSentryConfigProps): Record<string, unknown> | null {
  if (!dsn) return null;

  return {
    dsn,
    tracesSampleRate: 0,
    environment,
    enableLogs: sentryLogs === 'all' || sentryLogs === 'error',
    beforeSend(event: Record<string, unknown>) {
      const prefix = `[${component}]`;
      const ex = event.exception as
        | { values?: { type?: string }[] }
        | undefined;

      if (ex?.values?.[0]?.type) {
        ex.values[0].type = `${prefix} ${ex.values[0].type}`;

        return event;
      }

      if (typeof event.message === 'string') {
        event.message = `${prefix} ${event.message}`;
      }

      return event;
    },
    beforeSendLog(log: { level: string; message?: string }) {
      const shouldKeep =
        sentryLogs === 'all' ||
        (sentryLogs === 'error' && log.level === 'error');

      return shouldKeep ? log : null;
    },
  };
}
