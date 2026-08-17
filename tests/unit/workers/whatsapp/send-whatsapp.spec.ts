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
    });

    expect(getSentPayload()).toEqual({
      messaging_product: 'whatsapp',
      to: '+5511999999999',
      type: 'template',
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
      expect.objectContaining({ phone: '+5511999999999' }),
    );
  });

  it('sends "declineSurvey" template with reason and support contacts', async () => {
    await sendWhatsApp({
      template: 'declineSurvey',
      to: '+5511999999999',
      name: 'Test',
      reason: 'Documento inválido',
    });

    const payload = getSentPayload();

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
      }),
    ).rejects.toThrow('Social Messaging error');

    expect(mockLogError).toHaveBeenCalledWith(
      'WhatsApp message send failed',
      expect.objectContaining({ phone: '+5511999999999' }),
    );
  });
});
