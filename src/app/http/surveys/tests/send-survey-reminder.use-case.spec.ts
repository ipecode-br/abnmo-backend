import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { SendSurveyReminderUseCase } from '@/app/http/surveys/use-cases/send-survey-reminder.use-case';
import { SendReminderSignatureUseCase } from '@/app/signature/use-cases/send-reminder-signature.use-case';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';

describe('SendSurveyReminderUseCase', () => {
  let useCase: SendSurveyReminderUseCase;
  let repo: MockProxy<Repository<Survey>>;
  let sendReminderSignatureUseCase: MockProxy<SendReminderSignatureUseCase>;
  let logger: MockProxy<LogService>;

  beforeEach(async () => {
    repo = mock<Repository<Survey>>();
    sendReminderSignatureUseCase = mock<SendReminderSignatureUseCase>();
    logger = mock<LogService>();

    const module = await Test.createTestingModule({
      providers: [
        SendSurveyReminderUseCase,
        { provide: getRepositoryToken(Survey), useValue: repo },
        {
          provide: SendReminderSignatureUseCase,
          useValue: sendReminderSignatureUseCase,
        },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(SendSurveyReminderUseCase);
  });

  it('sends reminder successfully', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sur-1',
      status: 'pending_signature',
      signatureId: 'sig-1',
      user: {
        name: 'Alice',
        email: 'alice@example.com',
        phone: '11999999999',
        cpf: '12345678901',
      },
    } as unknown as Survey);
    sendReminderSignatureUseCase.execute.mockResolvedValue({ notified: true });

    await useCase.execute('sur-1');

    expect(sendReminderSignatureUseCase.execute).toHaveBeenCalledWith({
      signatureId: 'sig-1',
    });
    expect(logger.log).toHaveBeenCalledWith(
      'Survey signature reminder sent',
      expect.objectContaining({ id: 'sur-1', signatureId: 'sig-1' }),
    );
  });

  it('throws NotFoundException when survey not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });

  it('throws BadRequestException when survey is not pending_signature', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sur-1',
      status: 'completed',
      signatureId: 'sig-1',
      user: { name: 'Alice', email: 'a@a.com', phone: '1', cpf: '1' },
    } as unknown as Survey);

    await expect(useCase.execute('sur-1')).rejects.toThrow(BadRequestException);
  });

  it('throws BadRequestException when survey has no signatureId', async () => {
    repo.findOne.mockResolvedValue({
      id: 'sur-1',
      status: 'pending_signature',
      signatureId: null,
      user: { name: 'Alice', email: 'a@a.com', phone: '1', cpf: '1' },
    } as unknown as Survey);

    await expect(useCase.execute('sur-1')).rejects.toThrow(BadRequestException);
  });
});
