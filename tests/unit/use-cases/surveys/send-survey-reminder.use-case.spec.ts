import { BadRequestException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { SendSurveyReminderUseCase } from '@/app/http/surveys/use-cases/send-survey-reminder.use-case';
import { SendReminderSignatureUseCase } from '@/app/signature/use-cases/send-reminder-signature.use-case';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';

describe('SendSurveyReminderUseCase', () => {
  let useCase: SendSurveyReminderUseCase;
  let repo: MockProxy<Repository<Survey>>;
  let sendReminderSignatureUseCase: MockProxy<SendReminderSignatureUseCase>;

  const patient = patientUserFactory({
    name: 'Alice',
    email: 'alice@example.com',
    phone: '11999999999',
    cpf: '12345678901',
  });

  const survey = surveyFactory(patient, {
    id: 'sur-1',
    status: 'pending_signature',
    signatureId: 'sig-1',
  });

  beforeEach(async () => {
    repo = mock<Repository<Survey>>();
    sendReminderSignatureUseCase = mock<SendReminderSignatureUseCase>();

    const module = await Test.createTestingModule({
      providers: [
        SendSurveyReminderUseCase,
        { provide: getRepositoryToken(Survey), useValue: repo },
        {
          provide: SendReminderSignatureUseCase,
          useValue: sendReminderSignatureUseCase,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(SendSurveyReminderUseCase);
  });

  it('sends reminder successfully', async () => {
    repo.findOne.mockResolvedValue(survey as unknown as Survey);
    sendReminderSignatureUseCase.execute.mockResolvedValue({ notified: true });

    await useCase.execute('sur-1');

    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sur-1' } }),
    );
    expect(sendReminderSignatureUseCase.execute).toHaveBeenCalledWith({
      signatureId: 'sig-1',
    });
  });

  describe('Error cases', () => {
    it('throws NotFoundException when survey not found', async () => {
      repo.findOne.mockResolvedValue(null);

      await expect(useCase.execute('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('throws BadRequestException when survey is not pending_signature', async () => {
      const completedSurvey = {
        ...survey,
        status: 'completed',
      } as unknown as Survey;
      repo.findOne.mockResolvedValue(completedSurvey);

      await expect(useCase.execute('sur-1')).rejects.toThrow(
        BadRequestException,
      );
    });

    it('throws BadRequestException when survey has no signatureId', async () => {
      const noSignatureSurvey = {
        ...survey,
        signatureId: null,
      } as unknown as Survey;
      repo.findOne.mockResolvedValue(noSignatureSurvey);

      await expect(useCase.execute('sur-1')).rejects.toThrow(
        BadRequestException,
      );
    });
  });
});
