import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { mock, MockProxy } from 'jest-mock-extended';

import { CompleteSurveyUseCase } from '@/app/http/surveys/use-cases/complete-survey.use-case';
import { SurveySignatureWebhookUseCase } from '@/app/http/webhooks/use-cases/survey-signature-webhook.use-case';
import { LogService } from '@/common/log/log.service';

describe('SurveySignatureWebhookUseCase', () => {
  let useCase: SurveySignatureWebhookUseCase;
  let completeSurveyUseCase: MockProxy<CompleteSurveyUseCase>;
  let logger: MockProxy<LogService>;

  const DOCUMENT_KEY = '588ab577-7446-4ac6-9741-166591de12dc';

  beforeEach(async () => {
    completeSurveyUseCase = mock<CompleteSurveyUseCase>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        SurveySignatureWebhookUseCase,
        { provide: CompleteSurveyUseCase, useValue: completeSurveyUseCase },
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
  });

  it('bypasses when metadata is missing', async () => {
    const result = await useCase.execute({
      event: { name: 'auto_close' },
      document: { key: DOCUMENT_KEY, status: 'closed' },
    });

    expect(result.success).toBe(true);
    expect(completeSurveyUseCase.execute).not.toHaveBeenCalled();
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
  });

  it('rethrows NotFoundException from CompleteSurveyUseCase', async () => {
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
  });
});
