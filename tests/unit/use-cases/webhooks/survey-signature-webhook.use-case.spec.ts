import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { CreateWebhookEventUseCase } from '@/app/http/webhooks/use-cases/create-webhook-event.use-case';
import { SurveySignatureWebhookUseCase } from '@/app/http/webhooks/use-cases/survey-signature-webhook.use-case';
import { UpdateWebhookEventStatusUseCase } from '@/app/http/webhooks/use-cases/update-webhook-event-status.use-case';
import { LogService } from '@/common/log/log.service';

describe('SurveySignatureWebhookUseCase', () => {
  let useCase: SurveySignatureWebhookUseCase;
  let completeSurveyUseCase: MockProxy<CompleteSurveyUseCase>;
  let createWebhookEventUseCase: MockProxy<CreateWebhookEventUseCase>;
  let updateWebhookEventStatusUseCase: MockProxy<UpdateWebhookEventStatusUseCase>;
  let logger: MockProxy<LogService>;

  const DOCUMENT_KEY = '588ab577-7446-4ac6-9741-166591de12dc';
  const WEBHOOK_EVENT_ID = 'webhook-event-id';
  const fakeWebhookEvent = { id: WEBHOOK_EVENT_ID } as any;

  beforeEach(async () => {
    completeSurveyUseCase = mock<CompleteSurveyUseCase>();
    createWebhookEventUseCase = mock<CreateWebhookEventUseCase>();
    updateWebhookEventStatusUseCase = mock<UpdateWebhookEventStatusUseCase>();
    logger = mock<LogService>();

    createWebhookEventUseCase.execute.mockResolvedValue(fakeWebhookEvent);

    const module = await Test.createTestingModule({
      providers: [
        SurveySignatureWebhookUseCase,
        { provide: CompleteSurveyUseCase, useValue: completeSurveyUseCase },
        {
          provide: CreateWebhookEventUseCase,
          useValue: createWebhookEventUseCase,
        },
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
    const result = await useCase.execute({
      event: { name: 'auto_close' },
      document: {
        key: DOCUMENT_KEY,
        status: 'closed',
        metadata: { key: 'wrong-key' },
      },
    });

    expect(result.success).toBe(true);
    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
    expect(updateWebhookEventStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('bypasses when metadata is missing', async () => {
    const result = await useCase.execute({
      event: { name: 'auto_close' },
      document: { key: DOCUMENT_KEY, status: 'closed' },
    });

    expect(result.success).toBe(true);
    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
    expect(updateWebhookEventStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('bypasses when event is not a completion event', async () => {
    const result = await useCase.execute({
      event: { name: 'sign' },
      document: {
        key: DOCUMENT_KEY,
        status: 'closed',
        metadata: { key: 'catalogacao-abnmo' },
      },
    });

    expect(result.success).toBe(true);
    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
    expect(updateWebhookEventStatusUseCase.execute).not.toHaveBeenCalled();
  });

  it('calls CompleteSurveyUseCase when metadata matches and event is completion', async () => {
    await useCase.execute({
      event: { name: 'auto_close' },
      document: {
        key: DOCUMENT_KEY,
        status: 'closed',
        metadata: { key: 'catalogacao-abnmo' },
      },
    });

    expect(completeSurveyUseCase.execute).toHaveBeenCalledWith({
      signatureId: DOCUMENT_KEY,
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'success',
    });
  });

  it('calls CompleteSurveyUseCase for close event', async () => {
    await useCase.execute({
      event: { name: 'close' },
      document: {
        key: DOCUMENT_KEY,
        status: 'closed',
        metadata: { key: 'catalogacao-abnmo' },
      },
    });

    expect(completeSurveyUseCase.execute).toHaveBeenCalledWith({
      signatureId: DOCUMENT_KEY,
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'success',
    });
  });

  it('calls CompleteSurveyUseCase for document_closed event', async () => {
    await useCase.execute({
      event: { name: 'document_closed' },
      document: {
        key: DOCUMENT_KEY,
        status: 'closed',
        metadata: { key: 'catalogacao-abnmo' },
      },
    });

    expect(completeSurveyUseCase.execute).toHaveBeenCalledWith({
      signatureId: DOCUMENT_KEY,
    });
    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'success',
    });
  });

  it('rethrows NotFoundException and updates status to failed', async () => {
    completeSurveyUseCase.execute.mockRejectedValue(
      new NotFoundException(
        'Nenhuma catalogação encontrada para esta assinatura.',
      ),
    );

    await expect(
      useCase.execute({
        event: { name: 'auto_close' },
        document: {
          key: DOCUMENT_KEY,
          status: 'closed',
          metadata: { key: 'catalogacao-abnmo' },
        },
      }),
    ).rejects.toThrow(NotFoundException);

    expect(updateWebhookEventStatusUseCase.execute).toHaveBeenCalledWith({
      id: WEBHOOK_EVENT_ID,
      status: 'failed',
    });
  });
});
