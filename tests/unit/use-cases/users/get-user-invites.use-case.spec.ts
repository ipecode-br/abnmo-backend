import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { GetUserInvitesUseCase } from '@/app/http/users/use-cases/get-user-invites.use-case';
import type { RequestUser } from '@/common/types';
import { Token } from '@/domain/entities/token';

type TokenStub = Pick<Token, 'id' | 'email' | 'expiresAt' | 'createdAt'>;

const makeToken = (overrides: Partial<TokenStub> = {}): Token =>
  ({
    id: 'token-1',
    email: 'invite@test.com',
    type: 'invite_user',
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date('2024-01-01'),
    ...overrides,
  }) as Token;

describe('GetUserInvitesUseCase', () => {
  let useCase: GetUserInvitesUseCase;
  let tokensRepo: MockProxy<Repository<Token>>;

  const invite1 = makeToken();
  const invite2 = makeToken({ id: 'token-2', email: 'two@test.com' });
  const user: RequestUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin',
    features: [],
  };

  beforeEach(async () => {
    tokensRepo = mock<Repository<Token>>();

    const module = await Test.createTestingModule({
      providers: [
        GetUserInvitesUseCase,
        {
          provide: getRepositoryToken(Token),
          useValue: tokensRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetUserInvitesUseCase);
  });

  it('returns paginated invites ordered by date', async () => {
    tokensRepo.count.mockResolvedValue(2);
    tokensRepo.find.mockResolvedValue([invite1, invite2]);

    const result = await useCase.execute({ user, page: 1, perPage: 10 });

    expect(tokensRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        order: { createdAt: undefined },
      }),
    );
    expect(result.total).toBe(2);
    expect(result.invites).toHaveLength(2);
    expect(result.invites[0]).toEqual({
      id: invite1.id,
      email: invite1.email,
      expiresAt: invite1.expiresAt,
      createdAt: invite1.createdAt,
    });
    expect(result.invites[1]).toEqual({
      id: invite2.id,
      email: invite2.email,
      expiresAt: invite2.expiresAt,
      createdAt: invite2.createdAt,
    });
  });

  it('filters invites by search', async () => {
    const invite = makeToken({ email: 'john@test.com' });
    tokensRepo.count.mockResolvedValue(1);
    tokensRepo.find.mockResolvedValue([invite]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      search: 'john',
    });

    expect(tokensRepo.count).toHaveBeenCalled();
    expect(result.invites).toHaveLength(1);
    expect(result.invites[0].email).toBe('john@test.com');
  });

  it('filters invites by date range', async () => {
    tokensRepo.count.mockResolvedValue(1);
    tokensRepo.find.mockResolvedValue([invite1]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      startDate: new Date('2024-01-01'),
      endDate: new Date('2024-12-31'),
    });

    expect(tokensRepo.count).toHaveBeenCalled();
    expect(result.invites).toHaveLength(1);
  });

  it('paginates correctly', async () => {
    tokensRepo.count.mockResolvedValue(11);
    tokensRepo.find.mockResolvedValue([invite1]);

    await useCase.execute({ user, page: 2, perPage: 10 });

    expect(tokensRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('orders by email when specified', async () => {
    tokensRepo.count.mockResolvedValue(1);
    tokensRepo.find.mockResolvedValue([invite1]);

    await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      orderBy: 'email',
      order: 'DESC',
    });

    expect(tokensRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { email: 'DESC' } }),
    );
  });

  describe('Edge cases', () => {
    it('handles empty result', async () => {
      tokensRepo.count.mockResolvedValue(0);
      tokensRepo.find.mockResolvedValue([]);

      const result = await useCase.execute({ user, page: 1, perPage: 10 });

      expect(result.total).toBe(0);
      expect(result.invites).toHaveLength(0);
    });
  });
});
