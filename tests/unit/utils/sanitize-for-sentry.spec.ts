import { sanitizeBodyForSentry } from '@/utils/sanitize-for-sentry';

const USER_ID = '01900000-0000-7000-8000-000000000001';

describe('sanitizeBodyForSentry()', () => {
  it('masks the WhatsApp recipient inside a stringified webhook entry', () => {
    const body = JSON.stringify({
      Type: 'Notification',
      Message: JSON.stringify({
        whatsAppWebhookEntry: JSON.stringify({
          changes: [
            {
              value: {
                statuses: [
                  {
                    id: 'wamid.1',
                    status: 'failed',
                    recipient_id: '+5511999999999',
                    biz_opaque_callback_data: USER_ID,
                  },
                ],
              },
            },
          ],
        }),
        messageId: 'aws-message-1',
      }),
    });

    const result = sanitizeBodyForSentry(body) as Record<string, unknown>;
    const message = result.Message as string;

    expect(message).toContain('+551199***99');
    expect(message).toContain(USER_ID);
    expect(message).not.toContain('+5511999999999');
  });

  it('masks the WhatsApp recipient inside an object webhook entry', () => {
    const body = JSON.stringify({
      whatsAppWebhookEntry: {
        changes: [
          {
            value: {
              statuses: [
                {
                  recipient_id: '+5511888888888',
                  biz_opaque_callback_data: USER_ID,
                },
              ],
            },
          },
        ],
      },
    });

    const serialized = JSON.stringify(sanitizeBodyForSentry(body));

    expect(serialized).toContain('+551188***88');
    expect(serialized).toContain(USER_ID);
    expect(serialized).not.toContain('+5511888888888');
  });

  it('masks phone fields while keeping the userId', () => {
    const body = JSON.stringify({
      payload: { to: '+5511999999999', userId: USER_ID },
    });

    expect(sanitizeBodyForSentry(body)).toEqual({
      payload: { to: '+551199***99', userId: USER_ID },
    });
  });

  it('anonymizes email, name and cpf fields', () => {
    const body = JSON.stringify({
      to: 'user@example.com',
      name: 'John Doe',
      cpf: '52998224725',
    });

    expect(sanitizeBodyForSentry(body)).toEqual({
      to: 'use***@example.com',
      name: 'Joh***Doe',
      cpf: '529***25',
    });
  });

  it('masks phone fields when the body is not valid JSON', () => {
    const body = '{"recipient_id":"+5511999999999"';

    expect(sanitizeBodyForSentry(body)).toBe('{"recipient_id":"+551199***99"');
  });
});
