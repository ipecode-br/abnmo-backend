import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

const mockSentryCaptureException = jest.fn();

jest.mock('@sentry/nestjs', () => ({
  captureException: mockSentryCaptureException,
}));

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { SurveySignatureWebhookUseCase } from '@/app/http/webhooks/use-cases/survey-signature-webhook.use-case';
import { UpdateWebhookEventStatusUseCase } from '@/app/http/webhooks/use-cases/update-webhook-event-status.use-case';
import { LogService } from '@/common/log/log.service';

describe('SurveySignatureWebhookUseCase', () => {
  let useCase: SurveySignatureWebhookUseCase;
  let completeSurveyUseCase: MockProxy<CompleteSurveyUseCase>;
  let updateWebhookEventStatusUseCase: MockProxy<UpdateWebhookEventStatusUseCase>;
  let logger: MockProxy<LogService>;

  const DOCUMENT_KEY = '588ab577-7446-4ac6-9741-166591de12dc';
  const WEBHOOK_EVENT_ID = 'webhook-event-id';

  const makePayload = (overrides?: Record<string, unknown>) => ({
    webhookEventId: WEBHOOK_EVENT_ID,
    payload: {
      event: {
        name: 'auto_close',
        ...(overrides?.event as Record<string, unknown> | undefined),
      },
      document: {
        key: DOCUMENT_KEY,
        status: 'closed',
        metadata: { key: 'catalogacao-abnmo' },
        ...(overrides?.document as Record<string, unknown> | undefined),
      },
    },
  });

  beforeEach(async () => {
    completeSurveyUseCase = mock<CompleteSurveyUseCase>();
    updateWebhookEventStatusUseCase = mock<UpdateWebhookEventStatusUseCase>();
    logger = mock<LogService>();
    mockSentryCaptureException.mockClear();

    const module = await Test.createTestingModule({
      providers: [
        SurveySignatureWebhookUseCase,
        { provide: CompleteSurveyUseCase, useValue: completeSurveyUseCase },
        {
          provide: UpdateWebhookEventStatusUseCase,
          useValue: updateWebhookEventStatusUseCase,
        },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(SurveySignatureWebhookUseCase);
  });

  it('bypasses when metadata key does not match', async () => {
    const input = makePayload({ document: { metadata: { key: 'wrong-key' } } });
    await useCase.execute(input);

    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
    expect(updateWebhookEventStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('bypasses when metadata is missing', async () => {
    const input = makePayload({ document: { metadata: undefined } });
    await useCase.execute(input);

    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
    expect(updateWebhookEventStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('bypasses when event is not a completion event', async () => {
    const input = makePayload({ event: { name: 'sign' } });
    await useCase.execute(input);

    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
    expect(updateWebhookEventStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('calls "CompleteSurveyUseCase" when metadata matches and event is completion', async () => {
    await useCase.execute(makePayload());

    expect(completeSurveyUseCase.execute).toHaveBeenCalledWith({
      signatureDocumentId: DOCUMENT_KEY,
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'success',
    });
  });

  it('calls "CompleteSurveyUseCase" for close event', async () => {
    const input = makePayload({ event: { name: 'close' } });
    await useCase.execute(input);

    expect(completeSurveyUseCase.execute).toHaveBeenCalledWith({
      signatureDocumentId: DOCUMENT_KEY,
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'success',
    });
  });

  it('calls "CompleteSurveyUseCase" for "document_closed" event', async () => {
    const input = makePayload({ event: { name: 'document_closed' } });
    await useCase.execute(input);

    expect(completeSurveyUseCase.execute).toHaveBeenCalledWith({
      signatureDocumentId: DOCUMENT_KEY,
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'success',
    });
  });

  it('logs the error and reports it to Sentry when "CompleteSurveyUseCase" fails', async () => {
    const error = new NotFoundException(
      'Nenhuma catalogação encontrada para esta assinatura.',
    );
    completeSurveyUseCase.execute.mockRejectedValue(error);

    await expect(useCase.execute(makePayload())).resolves.toBeUndefined();

    expect(logger.error).toHaveBeenCalledWith(
      'Failed to complete survey from signature webhook',
      expect.objectContaining({
        error: 'Nenhuma catalogação encontrada para esta assinatura.',
      }),
    );
    expect(mockSentryCaptureException).toHaveBeenCalledWith(error, {
      captureContext: {
        level: 'error',
        extra: {
          eventName: 'auto_close',
          documentKey: DOCUMENT_KEY,
          documentStatus: 'closed',
        },
      },
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'failed',
    });
  });
});
