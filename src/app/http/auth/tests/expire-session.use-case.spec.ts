import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import { Session } from '@/domain/entities/session';

import { ExpireSessionUseCase } from '../use-cases/expire-session.use-case';

describe('ExpireSessionUseCase', () => {
  let useCase: ExpireSessionUseCase;
  let sessionsRepo: MockProxy<Repository<Session>>;

  beforeEach(async () => {
    sessionsRepo = mock<Repository<Session>>();

    const module = await Test.createTestingModule({
      providers: [
        ExpireSessionUseCase,
        { provide: getRepositoryToken(Session), useValue: sessionsRepo },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(ExpireSessionUseCase);
  });

  it('expires session by tokenHash', async () => {
    await useCase.execute({ tokenHash: 'some-hash' });

    expect(sessionsRepo.update).toHaveBeenCalledWith(
      { tokenHash: 'some-hash' },
      { expiresAt: expect.any(Date) },
    );
  });

  it('expires session by userId', async () => {
    await useCase.execute({ userId: 'user-1' });

    expect(sessionsRepo.update).toHaveBeenCalledWith(
      { userId: 'user-1' },
      { expiresAt: expect.any(Date) },
    );
  });
});
