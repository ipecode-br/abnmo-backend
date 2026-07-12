import { NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CancelUserInviteUseCase } from '@/app/http/users/use-cases/cancel-user-invite.use-case';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';

type TokenStub = Pick<Token, 'id' | 'email' | 'expiresAt'> & { type: string };

const makeToken = (overrides: Partial<TokenStub> = {}): Token =>
  ({
    id: 'invite-1',
    email: 'invite@test.com',
    type: 'invite_user',
    expiresAt: new Date('2025-12-31'),
    ...overrides,
  }) as Token;

describe('CancelUserInviteUseCase', () => {
  let useCase: CancelUserInviteUseCase;
  let tokensRepo: MockProxy<Repository<Token>>;

  const invite = makeToken();

  beforeEach(async () => {
    tokensRepo = mock<Repository<Token>>();

    const module = await Test.createTestingModule({
      providers: [
        CancelUserInviteUseCase,
        {
          provide: getRepositoryToken(Token),
          useValue: tokensRepo,
        },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(CancelUserInviteUseCase);
  });

  it('cancels invite by removing the token', async () => {
    tokensRepo.findOne.mockResolvedValue(invite);

    await useCase.execute({ id: invite.id });

    expect(tokensRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: invite.id, type: 'invite_user' },
      }),
    );
    expect(tokensRepo.remove).toHaveBeenCalledWith(invite);
  });

  describe('Edge cases', () => {
    it('throws "NotFoundException" when token does not exist', async () => {
      tokensRepo.findOne.mockResolvedValue(null);

      await expect(useCase.execute({ id: 'nonexistent' })).rejects.toThrow(
        NotFoundException,
      );

      expect(tokensRepo.remove).not.toHaveBeenCalled();
    });
  });
});
