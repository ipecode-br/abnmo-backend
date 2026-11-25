import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Test } from '@nestjs/testing';
import * as Sentry from '@sentry/nestjs';

import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import type { SendEmailJob } from '@/shared/queue/schemas/email';

jest.mock('@sentry/nestjs', () => ({
  captureException: jest.fn(),
}));

describe('EnqueueEmailUseCase', () => {
  let useCase: EnqueueEmailUseCase;
  let sqs: { send: jest.Mock };
  let logger: { log: jest.Mock; error: jest.Mock };

  const USER_ID = '01900000-0000-7000-8000-000000000001';
  const INVITE_ID = '01900000-0000-7000-8000-000000000002';

  const job: SendEmailJob = {
    template: 'recoverPassword',
    to: 'test@example.com',
    name: 'Test',
    resetPasswordUrl: 'https://example.com/nova-senha?token=abc',
    userId: USER_ID,
  };

  const inviteJob: SendEmailJob = {
    template: 'registerUser',
    to: 'newuser@example.com',
    registerUserUrl: 'https://example.com/cadastrar?token=abc',
    inviteId: INVITE_ID,
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    sqs = { send: jest.fn().mockResolvedValue({}) };
    logger = { log: jest.fn(), error: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        EnqueueEmailUseCase,
        {
          provide: EnvService,
          useValue: {
            get: jest.fn().mockReturnValue('email-queue-url'),
          },
        },
        { provide: SQSClient, useValue: sqs },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(EnqueueEmailUseCase);
  });

  it('enqueues the email job and logs the userId', async () => {
    await useCase.execute(job);

    expect(sqs.send).toHaveBeenCalledTimes(1);

    const command = sqs.send.mock.calls[0][0] as SendMessageCommand;
    expect(command).toBeInstanceOf(SendMessageCommand);
    expect(command.input.QueueUrl).toBe('email-queue-url');

    const body = JSON.parse(command.input.MessageBody as string);
    expect(body).toEqual({
      version: 1,
      type: 'email',
      payload: job,
      idempotencyKey: expect.any(String),
    });
    expect(logger.log).toHaveBeenCalledWith('E-mail job enqueued', {
      template: 'recoverPassword',
      userId: USER_ID,
      email: 'tes***@example.com',
    });
  });

  it('logs the "inviteId" for invitation emails', async () => {
    await useCase.execute(inviteJob);

    expect(logger.log).toHaveBeenCalledWith('E-mail job enqueued', {
      template: 'registerUser',
      userId: undefined,
      inviteId: INVITE_ID,
      email: 'new***@example.com',
    });
  });

  it('reports to Sentry when the message cannot be enqueued', async () => {
    const error = new Error('SQS unavailable');
    sqs.send.mockRejectedValue(error);

    await expect(useCase.execute(job)).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to enqueue email job',
      expect.objectContaining({
        template: 'recoverPassword',
        userId: USER_ID,
        email: 'tes***@example.com',
        error: 'SQS unavailable',
      }),
    );
    expect(Sentry.captureException).toHaveBeenCalledWith(
      error,
      expect.objectContaining({
        captureContext: expect.objectContaining({
          level: 'error',
          extra: {
            template: 'recoverPassword',
            userId: USER_ID,
            email: 'tes***@example.com',
          },
        }),
      }),
    );
  });
});
