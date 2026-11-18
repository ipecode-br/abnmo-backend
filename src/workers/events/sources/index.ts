import { env } from '../env';
import type { EventContext, SnsEnvelope } from '../types';
import { handleWhatsAppEvent } from './whatsapp';

export interface EventSource {
  name: string;
  matches: (sns: SnsEnvelope, payload: Record<string, unknown>) => boolean;
  handle: (
    payload: Record<string, unknown>,
    context: EventContext,
  ) => Promise<void> | void;
}

export class UnknownEventSourceError extends Error {
  constructor(topicArn: string | undefined, payloadKeys: string[]) {
    super(
      `Unknown event source (topicArn=${topicArn ?? 'unset'}, payloadKeys=${payloadKeys.join(',')})`,
    );
    this.name = 'UnknownEventSourceError';
  }
}

const eventSources: EventSource[] = [
  {
    name: 'whatsapp',
    matches: (sns, payload) =>
      (env.SNS_TOPIC_ARN_WHATSAPP !== '' &&
        sns.TopicArn === env.SNS_TOPIC_ARN_WHATSAPP) ||
      typeof payload.whatsAppWebhookEntry === 'string',
    handle: handleWhatsAppEvent,
  },
];

export function resolveEventSource(
  sns: SnsEnvelope,
  payload: Record<string, unknown>,
): EventSource {
  const source = eventSources.find((candidate) =>
    candidate.matches(sns, payload),
  );

  if (!source) {
    throw new UnknownEventSourceError(sns.TopicArn, Object.keys(payload));
  }

  return source;
}
