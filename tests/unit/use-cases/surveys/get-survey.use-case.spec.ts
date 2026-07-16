import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetSurveyUseCase } from '@/app/http/surveys/use-cases/get-survey.use-case';
import { Survey } from '@/domain/entities/survey';

const adminUser = requestUserFactory({ role: 'admin', features: [] });

describe('GetSurveyUseCase', () => {
  let useCase: GetSurveyUseCase;
  let repo: MockProxy<Repository<Survey>>;

  const patient = patientUserFactory({
    id: 'pat-1',
    name: 'Alice',
    phone: '11999999999',
    email: 'alice@example.com',
    cpf: '12345678901',
    susId: '987654321012345',
  });

  const survey = surveyFactory(patient, {
    id: 'sur-1',
    status: 'completed',
    dateOfBirth: '1990-06-15',
    gender: 'female_cis',
  });

  beforeEach(async () => {
    repo = mock<Repository<Survey>>();

    const module = await Test.createTestingModule({
      providers: [
        GetSurveyUseCase,
        { provide: getRepositoryToken(Survey), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetSurveyUseCase);
  });

  it('returns full survey details', async () => {
    repo.findOne.mockResolvedValue(survey as unknown as Survey);

    const result = await useCase.execute({ user: adminUser, id: 'sur-1' });

    expect(repo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { id: 'sur-1' } }),
    );
    expect(result).toMatchObject({
      id: 'sur-1',
      status: 'completed',
      dateOfBirth: '1990-06-15',
      gender: 'female_cis',
      user: {
        id: 'pat-1',
        name: 'Alice',
        phone: '11999999999',
        email: 'alice@example.com',
        cpf: '12345678901',
        susId: '987654321012345',
      },
    });
  });

  it('throws NotFoundException when survey not found', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ user: adminUser, id: 'nonexistent' }),
    ).rejects.toThrow(NotFoundException);
  });
});
