import { z } from 'zod';

const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockSentryCaptureMessage = jest.fn();

jest.mock('@/workers/events/logger', () => ({
  logger: { info: mockLogInfo, error: mockLogError },
}));

jest.mock('@sentry/node', () => ({
  captureMessage: mockSentryCaptureMessage,
}));

import type { QueueProcessedKeys } from '@/shared/queue/utils';
import { handleWhatsAppEvent } from '@/workers/events/sources/whatsapp';
import type { EventContext } from '@/workers/events/types';

function makeContext(
  processedKeys: QueueProcessedKeys = new Map(),
): EventContext {
  return {
    sns: {
      Type: 'Notification',
      MessageId: 'sns-message-1',
      TopicArn: 'arn:aws:sns:us-east-1:123456789012:whatsapp-events',
      Message: '{}',
      Timestamp: '2026-11-18T12:00:00.000Z',
    },
    messageId: 'msg-1',
    processedKeys,
  };
}

function makePayload(
  statuses: Record<string, unknown>[],
): Record<string, unknown> {
  return {
    whatsAppWebhookEntry: JSON.stringify({
      id: 'waba-id',
      changes: [
        {
          field: 'messages',
          value: {
            messaging_product: 'whatsapp',
            metadata: {
              display_phone_number: '5511999999999',
              phone_number_id: 'phone-number-id',
            },
            statuses,
          },
        },
      ],
    }),
    messageId: 'aws-message-1',
    message_timestamp: '2026-11-18T12:00:00.000Z',
  };
}

const metaParameterError = {
  code: 132000,
  title: 'Something went wrong',
  message:
    'Number of parameters does not match the number of params expected by the template',
  error_data: {
    details: 'Template survey_declined expects 2 params but 4 were sent.',
  },
};

describe('handleWhatsAppEvent()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('logs and captures a failed delivery with Meta error details', () => {
    const payload = makePayload([
      {
        id: 'wamid.failed',
        status: 'failed',
        timestamp: '1736379042',
        recipient_id: '5511999999999',
        errors: [metaParameterError],
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(mockLogError).toHaveBeenCalledWith(
      'WhatsApp message delivery failed',
      expect.objectContaining({
        wamid: 'wamid.failed',
        recipient: '+551199***99',
        awsMessageId: 'aws-message-1',
        metaErrorCode: 132000,
        metaErrorTitle: 'Something went wrong',
        metaErrorMessage: metaParameterError.message,
        metaErrorDetails: metaParameterError.error_data.details,
      }),
    );
    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      'WhatsApp message delivery failed (Meta 132000)',
      expect.objectContaining({
        level: 'error',
        tags: expect.objectContaining({
          worker: 'events',
          source: 'whatsapp',
        }),
        extra: expect.objectContaining({ wamid: 'wamid.failed' }),
      }),
    );
    expect(mockLogInfo).not.toHaveBeenCalled();
  });

  it('logs non-failed statuses without capturing Sentry', () => {
    const payload = makePayload([
      {
        id: 'wamid.delivered',
        status: 'delivered',
        timestamp: '1736379042',
        recipient_id: '5511999999999',
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(mockLogInfo).toHaveBeenCalledWith(
      'WhatsApp message status received',
      expect.objectContaining({
        wamid: 'wamid.delivered',
        status: 'delivered',
        recipient: '+551199***99',
      }),
    );
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockSentryCaptureMessage).not.toHaveBeenCalled();
  });

  it('processes mixed statuses in the same event', () => {
    const payload = makePayload([
      { id: 'wamid.a', status: 'delivered', recipient_id: '5511999999999' },
      {
        id: 'wamid.b',
        status: 'failed',
        recipient_id: '5511888888888',
        errors: [metaParameterError],
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(mockLogInfo).toHaveBeenCalledTimes(1);
    expect(mockLogError).toHaveBeenCalledTimes(1);
    expect(mockSentryCaptureMessage).toHaveBeenCalledTimes(1);
  });

  it('skips duplicate statuses within the dedup window', () => {
    const payload = makePayload([
      {
        id: 'wamid.duplicate',
        status: 'delivered',
        recipient_id: '5511999999999',
      },
    ]);
    const processedKeys: QueueProcessedKeys = new Map();

    handleWhatsAppEvent(payload, makeContext(processedKeys));
    handleWhatsAppEvent(payload, makeContext(processedKeys));

    expect(mockLogInfo).toHaveBeenCalledTimes(1);
  });

  it('does not log when the event has no statuses', () => {
    handleWhatsAppEvent(makePayload([]), makeContext());

    expect(mockLogInfo).not.toHaveBeenCalled();
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockSentryCaptureMessage).not.toHaveBeenCalled();
  });

  it('throws "ZodError" when payload misses "whatsAppWebhookEntry"', () => {
    expect(() =>
      handleWhatsAppEvent({ messageId: 'aws-message-1' }, makeContext()),
    ).toThrow(z.ZodError);
  });

  it('throws "SyntaxError" when webhook entry is not valid JSON', () => {
    expect(() =>
      handleWhatsAppEvent(
        { whatsAppWebhookEntry: 'not valid json' },
        makeContext(),
      ),
    ).toThrow(SyntaxError);
  });
});
