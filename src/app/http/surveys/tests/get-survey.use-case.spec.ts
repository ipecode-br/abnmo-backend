import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { surveyFactory } from 'tests/config/factories/survey.factory';
import { patientUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { GetSurveyUseCase } from '@/app/http/surveys/use-cases/get-survey.use-case';
import { Survey } from '@/domain/entities/survey';

describe('GetSurveyUseCase', () => {
  let useCase: GetSurveyUseCase;
  let repo: MockProxy<Repository<Survey>>;

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
    const user = patientUserFactory({
      id: 'pat-1',
      name: 'Alice',
      phone: '11999999999',
      email: 'alice@example.com',
      cpf: '12345678901',
      susId: '987654321012345',
    });
    const survey = surveyFactory(user, {
      id: 'sur-1',
      status: 'completed',
      dateOfBirth: '1990-06-15',
      gender: 'female_cis',
    });

    repo.findOne.mockResolvedValue(survey);

    const result = await useCase.execute('sur-1');

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

    await expect(useCase.execute('nonexistent')).rejects.toThrow(
      NotFoundException,
    );
  });
});
