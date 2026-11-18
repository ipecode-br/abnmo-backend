interface AwsErrorDetails {
  Code?: string;
  $fault?: string;
  $metadata?: {
    httpStatusCode?: number;
    requestId?: string;
  };
}

export function debugLog(
  event: string,
  data: Record<string, unknown> = {},
): void {
  console.log(`[debug] ${event}`, data);
}

export function describeError(err: unknown): Record<string, unknown> {
  if (!(err instanceof Error)) {
    return { errorValue: String(err), errorType: typeof err };
  }

  const awsError = err as Error & AwsErrorDetails;

  return {
    errorName: err.name,
    errorMessage: err.message,
    errorStack: err.stack,
    awsErrorCode: awsError.Code,
    awsFault: awsError.$fault,
    awsStatusCode: awsError.$metadata?.httpStatusCode,
    awsRequestId: awsError.$metadata?.requestId,
  };
}
