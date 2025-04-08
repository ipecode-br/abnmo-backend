import { APIGatewayProxyEvent } from 'aws-lambda';
import { Request } from 'express';

interface AppEvent {
  body: Record<string, unknown>;
  headers: Record<string, string | undefined>;
  method: string;
}

function isApiGatewayEvent(event: unknown): event is APIGatewayProxyEvent {
  return (
    typeof event === 'object' &&
    event !== null &&
    'httpMethod' in event &&
    'headers' in event
  );
}

export const normalizeEvent = (
  event: APIGatewayProxyEvent | Request,
): AppEvent => {
  if (isApiGatewayEvent(event)) {
    let parsedBody: Record<string, unknown> = {};

    try {
      parsedBody =
        typeof event.body === 'string'
          ? (JSON.parse(event.body) as Record<string, unknown>)
          : {};
    } catch {
      parsedBody = {};
    }

    return {
      body: parsedBody,
      headers: event.headers as Record<string, string | undefined>,
      method: event.httpMethod,
    };
  }

  const expressHeaders: Record<string, string | undefined> = {};
  for (const [key, value] of Object.entries(event.headers)) {
    expressHeaders[key] = Array.isArray(value) ? value.join(', ') : value;
  }

  return {
    body: event.body as Record<string, unknown>,
    headers: expressHeaders,
    method: event.method,
  };
};

export const app = (event: APIGatewayProxyEvent | Request) => {
  const normalizedEvent = normalizeEvent(event);

  return {
    message: `Hello from ${process.env.AWS_LAMBDA_FUNCTION_NAME ? 'Lambda' : 'Local'}`,
    receivedData: normalizedEvent,
  };
};
