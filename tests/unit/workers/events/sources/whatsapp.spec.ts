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

const USER_ID = '01900000-0000-7000-8000-000000000001';
const MASKED_RECIPIENT = '+551199***99';

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
        recipient_id: '+5511999999999',
        biz_opaque_callback_data: USER_ID,
        errors: [metaParameterError],
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(mockLogError).toHaveBeenCalledWith(
      'WhatsApp message delivery failed',
      expect.objectContaining({
        wamid: 'wamid.failed',
        status: 'failed',
        recipient: MASKED_RECIPIENT,
        userId: USER_ID,
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
        extra: expect.objectContaining({
          wamid: 'wamid.failed',
          recipient: MASKED_RECIPIENT,
          userId: USER_ID,
        }),
      }),
    );
    expect(mockLogInfo).not.toHaveBeenCalled();
  });

  it('never logs or captures the full recipient phone number', () => {
    const payload = makePayload([
      {
        id: 'wamid.no-leak',
        status: 'failed',
        recipient_id: '+5511999999999',
        biz_opaque_callback_data: USER_ID,
        errors: [metaParameterError],
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(JSON.stringify(mockLogError.mock.calls)).not.toContain(
      '+5511999999999',
    );
    expect(JSON.stringify(mockSentryCaptureMessage.mock.calls)).not.toContain(
      '+5511999999999',
    );
  });

  it('captures a handover failure reported with a generated status name', () => {
    const payload = makePayload([
      {
        id: 'wamid.handover',
        status: 'WhatsApp Message Handover Failed',
        recipient_id: '+5511999999999',
        biz_opaque_callback_data: USER_ID,
        errors: [
          {
            code: 131026,
            title: 'Message undeliverable',
            message: 'Message undeliverable',
          },
        ],
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(mockLogError).toHaveBeenCalledWith(
      'WhatsApp message delivery failed',
      expect.objectContaining({
        wamid: 'wamid.handover',
        status: 'WhatsApp Message Handover Failed',
        recipient: MASKED_RECIPIENT,
        userId: USER_ID,
        metaErrorCode: 131026,
      }),
    );
    expect(mockSentryCaptureMessage).toHaveBeenCalledWith(
      'WhatsApp message delivery failed (Meta 131026)',
      expect.anything(),
    );
  });

  it('logs non-failed statuses without capturing Sentry', () => {
    const payload = makePayload([
      {
        id: 'wamid.delivered',
        status: 'delivered',
        timestamp: '1736379042',
        recipient_id: '+5511999999999',
        biz_opaque_callback_data: USER_ID,
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    expect(mockLogInfo).toHaveBeenCalledWith(
      'WhatsApp message status received',
      expect.objectContaining({
        wamid: 'wamid.delivered',
        status: 'delivered',
        recipient: MASKED_RECIPIENT,
        userId: USER_ID,
      }),
    );
    expect(mockLogError).not.toHaveBeenCalled();
    expect(mockSentryCaptureMessage).not.toHaveBeenCalled();
  });

  it('logs a masked recipient when callback data is missing', () => {
    const payload = makePayload([
      {
        id: 'wamid.no-callback',
        status: 'delivered',
        recipient_id: '+5511999999999',
      },
    ]);

    handleWhatsAppEvent(payload, makeContext());

    const extras = mockLogInfo.mock.calls[0][1] as Record<string, unknown>;

    expect(extras.recipient).toBe(MASKED_RECIPIENT);
    expect(extras.userId).toBeUndefined();
  });

  it('processes mixed statuses in the same event', () => {
    const payload = makePayload([
      {
        id: 'wamid.a',
        status: 'delivered',
        recipient_id: '+5511999999999',
        biz_opaque_callback_data: USER_ID,
      },
      {
        id: 'wamid.b',
        status: 'failed',
        recipient_id: '+5511888888888',
        biz_opaque_callback_data: '01900000-0000-7000-8000-000000000002',
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
        recipient_id: '+5511999999999',
        biz_opaque_callback_data: USER_ID,
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

  it('accepts a webhook entry delivered as an object', () => {
    handleWhatsAppEvent(
      {
        whatsAppWebhookEntry: {
          id: 'waba-id',
          changes: [
            {
              field: 'messages',
              value: {
                statuses: [
                  {
                    id: 'wamid.object',
                    status: 'delivered',
                    recipient_id: '+5511999999999',
                    biz_opaque_callback_data: USER_ID,
                  },
                ],
              },
            },
          ],
        },
        messageId: 'aws-message-1',
      },
      makeContext(),
    );

    expect(mockLogInfo).toHaveBeenCalledWith(
      'WhatsApp message status received',
      expect.objectContaining({
        wamid: 'wamid.object',
        recipient: MASKED_RECIPIENT,
        userId: USER_ID,
      }),
    );
  });

  it('throws "TypeError" when payload misses "whatsAppWebhookEntry"', () => {
    expect(() =>
      handleWhatsAppEvent({ messageId: 'aws-message-1' }, makeContext()),
    ).toThrow(TypeError);
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
