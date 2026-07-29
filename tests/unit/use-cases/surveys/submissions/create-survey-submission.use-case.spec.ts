import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getDataSourceToken, getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { CreateSurveySubmissionBody } from '@/app/http/surveys/submissions/surveys.dtos';
import { CreateSurveySubmissionUseCase } from '@/app/http/surveys/submissions/use-cases/create-survey-submission.use-case';
import { GenerateUploadUrlUseCase } from '@/app/storage/use-cases/generate-upload-url.use-case';
import { LogService } from '@/common/log/log.service';
import { Document } from '@/domain/entities/document';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';

const makeTxRepo = () => {
  const repo = mock<Repository<any>>();
  repo.create.mockImplementation((data: any) => ({ id: 'new-id', ...data }));
  repo.save.mockImplementation((data: any) => Promise.resolve(data));
  return repo;
};

describe('CreateSurveySubmissionUseCase', () => {
  let useCase: CreateSurveySubmissionUseCase;
  let dataSource: MockProxy<DataSource>;
  let usersRepo: MockProxy<Repository<User>>;
  let cryptographyService: MockProxy<CryptographyService>;
  let generateUploadUrlUseCase: MockProxy<GenerateUploadUrlUseCase>;

  const createBody: CreateSurveySubmissionBody = {
    name: 'Alice',
    email: 'alice@example.com',
    phone: '11999999999',
    mimeType: 'application/pdf',
    fileSize: 1024,
    fillingMethod: 'self',
  };

  beforeEach(async () => {
    dataSource = mock<DataSource>();
    usersRepo = mock<Repository<User>>();
    cryptographyService = mock<CryptographyService>();
    generateUploadUrlUseCase = mock<GenerateUploadUrlUseCase>();

    const envService = {
      get: jest.fn().mockReturnValue('https://cdn.example.com'),
    };

    cryptographyService.createHash.mockResolvedValue('hashed-password');

    dataSource.transaction.mockImplementation(async (cb: any) => {
      const txUsersRepo = makeTxRepo();
      const txSubmissionsRepo = makeTxRepo();
      const txDocumentsRepo = makeTxRepo();
      const manager = mock<any>();
      manager.getRepository.mockImplementation((entity: any) => {
        if (entity === User) return txUsersRepo;
        if (entity === SurveySubmission) return txSubmissionsRepo;
        if (entity === Document) return txDocumentsRepo;
        return makeTxRepo();
      });
      return cb(manager);
    });

    generateUploadUrlUseCase.execute.mockResolvedValue({
      url: 'https://upload.example.com/presigned',
      fields: { key: 'value' },
    });

    const module = await Test.createTestingModule({
      providers: [
        CreateSurveySubmissionUseCase,
        { provide: getDataSourceToken(), useValue: dataSource },
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: EnvService, useValue: envService },
        {
          provide: GenerateUploadUrlUseCase,
          useValue: generateUploadUrlUseCase,
        },
        {
          provide: LogService,
          useValue: { log: jest.fn(), setUser: jest.fn() },
        },
      ],
    }).compile();

    useCase = module.get(CreateSurveySubmissionUseCase);
  });

  it('creates submission successfully', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    const result = await useCase.execute(createBody);

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'alice@example.com' } }),
    );
    expect(cryptographyService.createHash).toHaveBeenCalled();
    expect(generateUploadUrlUseCase.execute).toHaveBeenCalled();
    expect(result).toMatchObject({
      submissionId: 'new-id',
      url: 'https://upload.example.com/presigned',
      fields: { key: 'value' },
    });
  });

  it('throws ConflictException for existing user email', async () => {
    usersRepo.findOne.mockResolvedValue({ id: 'existing-user' } as User);

    await expect(useCase.execute(createBody)).rejects.toThrow(
      ConflictException,
    );
  });
});
