const mockSendViaResend = jest.fn();
const mockSendViaSes = jest.fn();
const mockLogInfo = jest.fn();
const mockLogError = jest.fn();
const mockEnv: { EMAIL_PROVIDER: 'ses' | 'resend' | 'none' } = {
  EMAIL_PROVIDER: 'resend',
};

jest.mock('@/workers/email/env', () => ({ env: mockEnv }));

jest.mock('@/workers/email/logger', () => ({
  logger: { info: mockLogInfo, error: mockLogError },
}));

jest.mock('@/workers/email/providers/resend', () => ({
  sendViaResend: mockSendViaResend,
}));

jest.mock('@/workers/email/providers/ses', () => ({
  sendViaSes: mockSendViaSes,
}));

import type { SendEmailJob } from '@/shared/queue/schemas/email';
import { sendEmail } from '@/workers/email/send-email';

const USER_ID = '01900000-0000-7000-8000-000000000001';
const INVITE_ID = '01900000-0000-7000-8000-000000000002';

function makeJob(): SendEmailJob {
  return {
    template: 'recoverPassword',
    to: 'test@example.com',
    name: 'Test',
    resetPasswordUrl: 'https://example.com/nova-senha?token=abc',
    userId: USER_ID,
  };
}

describe('sendEmail()', () => {
  beforeEach(() => {
    mockEnv.EMAIL_PROVIDER = 'resend';
    mockSendViaResend.mockResolvedValue(undefined);
    mockSendViaSes.mockResolvedValue(undefined);
  });

  it('sends via Resend and logs the provider', async () => {
    await sendEmail(makeJob());

    expect(mockSendViaResend).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: expect.any(String),
      html: expect.any(String),
    });
    expect(mockSendViaSes).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith('Email sent', {
      userId: USER_ID,
      email: 'tes***@example.com',
      template: 'recoverPassword',
      provider: 'resend',
    });
  });

  it('sends via SES and logs the provider', async () => {
    mockEnv.EMAIL_PROVIDER = 'ses';

    await sendEmail(makeJob());

    expect(mockSendViaSes).toHaveBeenCalledWith({
      to: 'test@example.com',
      subject: expect.any(String),
      html: expect.any(String),
    });
    expect(mockSendViaResend).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith(
      'Email sent',
      expect.objectContaining({ provider: 'ses', userId: USER_ID }),
    );
  });

  it('logs "inviteId" for invitation emails', async () => {
    await sendEmail({
      template: 'registerUser',
      to: 'newuser@example.com',
      registerUserUrl: 'https://example.com/cadastrar?token=abc',
      inviteId: INVITE_ID,
    });

    expect(mockLogInfo).toHaveBeenCalledWith('Email sent', {
      userId: undefined,
      inviteId: INVITE_ID,
      email: 'new***@example.com',
      template: 'registerUser',
      provider: 'resend',
    });
  });

  it('skips sending when "EMAIL_PROVIDER" is "none"', async () => {
    mockEnv.EMAIL_PROVIDER = 'none';

    await sendEmail(makeJob());

    expect(mockSendViaResend).not.toHaveBeenCalled();
    expect(mockSendViaSes).not.toHaveBeenCalled();
    expect(mockLogInfo).toHaveBeenCalledWith('Email send skipped', {
      userId: USER_ID,
      email: 'tes***@example.com',
      template: 'recoverPassword',
      reason: 'EMAIL_PROVIDER is "none"',
    });
  });

  it('logs the provider and rethrows when sending fails', async () => {
    mockSendViaResend.mockRejectedValue(new Error('Resend error'));

    await expect(sendEmail(makeJob())).rejects.toThrow('Resend error');

    expect(mockLogError).toHaveBeenCalledWith('Email send failed', {
      userId: USER_ID,
      email: 'tes***@example.com',
      template: 'recoverPassword',
      provider: 'resend',
      error: 'Resend error',
    });
  });
});
