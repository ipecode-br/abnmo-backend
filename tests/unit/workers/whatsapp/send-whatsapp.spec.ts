const mockSendViaSocialMessaging = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();

jest.mock('@/workers/whatsapp/providers/social-messaging', () => ({
  sendViaSocialMessaging: mockSendViaSocialMessaging,
}));

jest.mock('@/workers/whatsapp/logger', () => ({
  logger: { info: mockLogInfo, error: mockLogError },
}));

import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/config';
import { sendWhatsApp } from '@/workers/whatsapp/send-whatsapp';

const USER_ID = '01900000-0000-7000-8000-000000000001';

function getSentPayload(): Record<string, unknown> {
  const { message } = mockSendViaSocialMessaging.mock.calls[0][0] as {
    message: Uint8Array;
  };
  return JSON.parse(new TextDecoder().decode(message));
}

describe('sendWhatsApp()', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockSendViaSocialMessaging.mockResolvedValue(undefined);
  });

  it('sends "completeSurvey" template with name and token', async () => {
    await sendWhatsApp({
      template: 'completeSurvey',
      to: '+5511999999999',
      name: 'Test',
      token: 'token-abc',
      userId: USER_ID,
    });

    expect(getSentPayload()).toEqual({
      messaging_product: 'whatsapp',
      to: '+5511999999999',
      type: 'template',
      biz_opaque_callback_data: USER_ID,
      template: {
        name: 'survey_approved',
        language: { code: 'pt_BR' },
        components: [
          {
            type: 'body',
            parameters: [{ type: 'text', text: 'Test' }],
          },
          {
            type: 'button',
            sub_type: 'url',
            index: '0',
            parameters: [{ type: 'text', text: 'token-abc' }],
          },
        ],
      },
    });
    expect(mockLogInfo).toHaveBeenCalledWith(
      'WhatsApp message sent',
      expect.objectContaining({ userId: USER_ID }),
    );
  });

  it('sends "declineSurvey" template with reason and support contacts', async () => {
    await sendWhatsApp({
      template: 'declineSurvey',
      to: '+5511999999999',
      name: 'Test',
      reason: 'Documento inválido',
      userId: USER_ID,
    });

    const payload = getSentPayload();

    expect(payload.biz_opaque_callback_data).toBe(USER_ID);
    expect(payload.template).toEqual({
      name: 'survey_declined',
      language: { code: 'pt_BR' },
      components: [
        {
          type: 'body',
          parameters: [
            { type: 'text', text: 'Test' },
            { type: 'text', text: 'Documento inválido' },
            { type: 'text', text: SUPPORT_WHATSAPP },
            { type: 'text', text: SUPPORT_EMAIL },
          ],
        },
      ],
    });
  });

  it('omits "biz_opaque_callback_data" when userId is not provided', async () => {
    await sendWhatsApp({
      template: 'declineSurvey',
      to: '+5511999999999',
      name: 'Test',
      reason: 'Documento inválido',
    });

    expect(getSentPayload()).not.toHaveProperty('biz_opaque_callback_data');
  });

  it('logs and rethrows when send fails', async () => {
    mockSendViaSocialMessaging.mockRejectedValue(
      new Error('Social Messaging error'),
    );

    await expect(
      sendWhatsApp({
        template: 'declineSurvey',
        to: '+5511999999999',
        name: 'Test',
        reason: 'Documento inválido',
        userId: USER_ID,
      }),
    ).rejects.toThrow('Social Messaging error');

    expect(mockLogError).toHaveBeenCalledWith(
      'WhatsApp message send failed',
      expect.objectContaining({ userId: USER_ID }),
    );
  });
});
