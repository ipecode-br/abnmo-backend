import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { User } from '@/domain/entities/user';

import {
  adminUserFactory,
  specialistUserFactory,
  userFactory,
} from '../../../../../tests/config/factories/user.factory';
import { GetUsersUseCase } from '../use-cases/get-users.use-case';

describe('GetUsersUseCase', () => {
  let useCase: GetUsersUseCase;
  let repo: MockProxy<Repository<User>>;

  beforeEach(async () => {
    repo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetUsersUseCase,
        { provide: getRepositoryToken(User), useValue: repo },
      ],
    }).compile();

    useCase = module.get(GetUsersUseCase);
  });

  it('returns paginated users excluding patients', async () => {
    const users = [
      adminUserFactory({ name: 'Admin User' }),
      specialistUserFactory({ name: 'Dr. Specialist' }),
    ] as User[];

    repo.count.mockResolvedValue(2);
    repo.find.mockResolvedValue(users);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(result.total).toBe(2);
    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toEqual({
      id: users[0].id,
      name: users[0].name,
      email: users[0].email,
      avatarUrl: users[0].avatarUrl,
      role: users[0].role,
      status: users[0].status,
      specialty: users[0].specialty,
      registrationId: users[0].registrationId,
      createdAt: users[0].createdAt,
    });
    expect(result.users[1]).toEqual({
      id: users[1].id,
      name: users[1].name,
      email: users[1].email,
      avatarUrl: users[1].avatarUrl,
      role: users[1].role,
      status: users[1].status,
      specialty: users[1].specialty,
      registrationId: users[1].registrationId,
      createdAt: users[1].createdAt,
    });
  });

  it('filters users by role', async () => {
    const users = [specialistUserFactory()] as User[];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(users);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      role: 'specialist',
    });

    expect(repo.count).toHaveBeenCalled();
    expect(repo.find).toHaveBeenCalled();
    expect(result.users).toHaveLength(1);
    expect(result.users[0].role).toBe('specialist');
  });

  it('filters users by status', async () => {
    const users = [adminUserFactory({ status: 'inactive' })] as User[];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(users);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      status: 'inactive',
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0].status).toBe('inactive');
  });

  it('filters users by search (name ILike)', async () => {
    const users = [adminUserFactory({ name: 'John Doe' })] as User[];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(users);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      search: 'John',
    });

    expect(repo.find).toHaveBeenCalled();
    expect(result.users).toHaveLength(1);
  });

  it('filters users by date range (startDate and endDate)', async () => {
    const users = [adminUserFactory()] as User[];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(users);

    const result = await useCase.execute({
      page: 1,
      perPage: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(repo.find).toHaveBeenCalled();
    expect(result.users).toHaveLength(1);
  });

  it('handles pagination correctly (page 2)', async () => {
    const users = [userFactory({ role: 'member' })] as User[];

    repo.count.mockResolvedValue(11);
    repo.find.mockResolvedValue(users);

    await useCase.execute({ page: 2, perPage: 10 });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('orders users by the specified field', async () => {
    const users = [adminUserFactory()] as User[];

    repo.count.mockResolvedValue(1);
    repo.find.mockResolvedValue(users);

    await useCase.execute({
      page: 1,
      perPage: 10,
      orderBy: 'date',
      order: 'DESC',
    });

    expect(repo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'DESC' } }),
    );
  });

  it('handles empty result', async () => {
    repo.count.mockResolvedValue(0);
    repo.find.mockResolvedValue([]);

    const result = await useCase.execute({ page: 1, perPage: 10 });

    expect(result.total).toBe(0);
    expect(result.users).toHaveLength(0);
  });
});
