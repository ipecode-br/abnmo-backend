import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';

import { CancelUserInviteUseCase } from '../use-cases/cancel-user-invite.use-case';

const makeToken = (overrides: Partial<Token> = {}): Token =>
  ({
    id: 'invite-id-1',
    email: 'invite@test.com',
    token: 'raw-token',
    type: 'invite_user',
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date('2024-01-01'),
    entityId: null,
    ...overrides,
  }) as Token;

describe('CancelUserInviteUseCase', () => {
  let useCase: CancelUserInviteUseCase;
  let repo: MockProxy<Repository<Token>>;
  let logger: { log: jest.Mock };

  beforeEach(async () => {
    repo = mock<Repository<Token>>();
    logger = { log: jest.fn() };

    const module = await Test.createTestingModule({
      providers: [
        CancelUserInviteUseCase,
        { provide: getRepositoryToken(Token), useValue: repo },
        { provide: LogService, useValue: logger },
      ],
    }).compile();

    useCase = module.get(CancelUserInviteUseCase);
  });

  it('cancels invite successfully (removes token)', async () => {
    const token = makeToken();

    repo.findOne.mockResolvedValue(token);

    await useCase.execute({ id: 'invite-id-1' });

    expect(repo.remove).toHaveBeenCalledWith(token);
    expect(logger.log).toHaveBeenCalledWith('Invite user token canceled', {
      id: token.id,
      email: token.email,
    });
  });

  it('throws NotFoundException when token does not exist', async () => {
    repo.findOne.mockResolvedValue(null);

    await expect(useCase.execute({ id: 'nonexistent-id' })).rejects.toThrow(
      NotFoundException,
    );
    expect(repo.remove).not.toHaveBeenCalled();
  });
});
