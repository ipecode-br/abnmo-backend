import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { Token } from '@/domain/entities/token';

import { GetUserInvitesUseCase } from '../use-cases/get-user-invites.use-case';

const makeToken = (overrides: Partial<Token> = {}): Token =>
  ({
    id: 'token-1',
    email: 'invite@test.com',
    token: 'raw-token-value',
    type: 'invite_user',
    expiresAt: new Date('2025-12-31'),
    createdAt: new Date('2024-01-01'),
    entityId: null,
    ...overrides,
  }) as Token;

describe('GetUserInvitesUseCase', () => {
  let useCase: GetUserInvitesUseCase;
  let repo: MockProxy<Repository<Token>>;

  beforeEach(async () => {
    repo = mock<Repository<Token>>();

    const module = await Test.createTestingModule({
      providers: [
        GetUserInvitesUseCase,
        { provide: getRepositoryToken(Token), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetUserInvitesUseCase);
  });

  it('returns paginated invites ordered by date (default)', async () => {
    const invites = [
      makeToken(),
      makeToken({ id: 'token-2', email: 'two@test.com' }),
    ];

    repo.count.mockResolvedValue(2);
    repo.find.mockResolvedValue(invites);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 0,
        take: 10,
        order: { createdAt: undefined },
      }),
    );
    expect(result.total).toBe(2);
    expect(result.invites).toHaveLength(2);
    expect(result.invites[0]).toEqual({
      id: 'token-1',
      email: 'invite@test.com',
      expiresAt: invites[0].expiresAt,
      createdAt: invites[0].createdAt,
    });
    expect(result.invites[1]).toEqual({
      id: 'token-2',
      email: 'two@test.com',
      expiresAt: invites[1].expiresAt,
      createdAt: invites[1].createdAt,
    });
  });

  it('filters invites by search (email ILike)', async () => {
    const invites = [makeToken({ email: 'john@test.com' })];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(invites);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      search: 'john',
    });

    expect(repo.find).toHaveBeenCalled();
    expect(result.invites).toHaveLength(1);
    expect(result.invites[0].email).toBe('john@test.com');
  });

  it('filters invites by date range', async () => {
    const invites = [makeToken()];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(invites);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(repo.find).toHaveBeenCalled();
    expect(result.invites).toHaveLength(1);
  });

  it('paginates correctly (page 2)', async () => {
    const invites = [makeToken({ id: 'token-11' })];

    repo.count.mockResolvedValue(11);
    repo.find.mockResolvedValue(invites);

    await useCase.execute({ page: 2, perPage: 10 });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('orders by email when specified', async () => {
    const invites = [makeToken()];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(invites);

    await useCase.execute({
      page: 1,
      perPage: 10,
      orderBy: 'email',
      order: 'DESC',
    });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { email: 'DESC' } }),
    );
  });

  it('handles empty result', async () => {
    repo.count.mockResolvedValue(0);
    repo.find.mockResolvedValue([]);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.total).toBe(0);
    expect(result.invites).toHaveLength(0);
  });
});
