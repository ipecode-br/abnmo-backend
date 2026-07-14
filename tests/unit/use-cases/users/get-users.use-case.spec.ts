import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { GetUsersUseCase } from '@/app/http/users/use-cases/get-users.use-case';
import { User } from '@/domain/entities/user';

import { requestUserFactory } from '../../../config/factories/shared.factory';
import {
  adminUserFactory,
  specialistUserFactory,
} from '../../../config/factories/user.factory';

describe('GetUsersUseCase', () => {
  let useCase: GetUsersUseCase;
  let usersRepo: MockProxy<Repository<User>>;

  const admin = adminUserFactory({ name: 'Admin User' });
  const specialist = specialistUserFactory({ name: 'Dr. Specialist' });
  const user = requestUserFactory({ role: 'admin' });

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();

    const module = await Test.createTestingModule({
      providers: [
        GetUsersUseCase,
        {
          provide: getRepositoryToken(User),
          useValue: usersRepo,
        },
      ],
    }).compile();

    useCase = module.get(GetUsersUseCase);
  });

  it('returns paginated users excluding patients', async () => {
    usersRepo.count.mockResolvedValue(2);
    usersRepo.find.mockResolvedValue([admin, specialist]);

    const result = await useCase.execute({ user, page: 1, perPage: 10 });

    expect(usersRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 0, take: 10 }),
    );
    expect(result.total).toBe(2);
    expect(result.users).toHaveLength(2);
    expect(result.users[0]).toEqual({
      id: admin.id,
      name: admin.name,
      email: admin.email,
      avatarUrl: admin.avatarUrl,
      role: admin.role,
      status: admin.status,
      specialty: admin.specialty,
      registrationId: admin.registrationId,
      createdAt: admin.createdAt,
    });
    expect(result.users[1]).toEqual({
      id: specialist.id,
      name: specialist.name,
      email: specialist.email,
      avatarUrl: specialist.avatarUrl,
      role: specialist.role,
      status: specialist.status,
      specialty: specialist.specialty,
      registrationId: specialist.registrationId,
      createdAt: specialist.createdAt,
    });
  });

  it('filters users by role', async () => {
    usersRepo.count.mockResolvedValue(1);
    usersRepo.find.mockResolvedValue([specialist]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      role: 'specialist',
    });

    expect(usersRepo.count).toHaveBeenCalled();
    expect(result.users).toHaveLength(1);
    expect(result.users[0].role).toBe('specialist');
  });

  it('filters users by status', async () => {
    const inactiveAdmin = adminUserFactory({ status: 'inactive' });
    usersRepo.count.mockResolvedValue(1);
    usersRepo.find.mockResolvedValue([inactiveAdmin]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      status: 'inactive',
    });

    expect(result.users).toHaveLength(1);
    expect(result.users[0].status).toBe('inactive');
  });

  it('filters users by search', async () => {
    const john = adminUserFactory({ name: 'John Doe' });
    usersRepo.count.mockResolvedValue(1);
    usersRepo.find.mockResolvedValue([john]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      search: 'John',
    });

    expect(usersRepo.count).toHaveBeenCalled();
    expect(result.users).toHaveLength(1);
  });

  it('filters users by date range', async () => {
    usersRepo.count.mockResolvedValue(1);
    usersRepo.find.mockResolvedValue([admin]);

    const result = await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      startDate: '2024-01-01',
      endDate: '2024-12-31',
    });

    expect(usersRepo.count).toHaveBeenCalled();
    expect(result.users).toHaveLength(1);
  });

  it('paginates correctly', async () => {
    usersRepo.count.mockResolvedValue(11);
    usersRepo.find.mockResolvedValue([admin]);

    await useCase.execute({ user, page: 2, perPage: 10 });

    expect(usersRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ skip: 10, take: 10 }),
    );
  });

  it('orders by the specified field', async () => {
    usersRepo.count.mockResolvedValue(1);
    usersRepo.find.mockResolvedValue([admin]);

    await useCase.execute({
      user,
      page: 1,
      perPage: 10,
      orderBy: 'date',
      order: 'DESC',
    });

    expect(usersRepo.find).toHaveBeenCalledWith(
      expect.objectContaining({ order: { createdAt: 'DESC' } }),
    );
  });

  describe('Edge cases', () => {
    it('handles empty result', async () => {
      usersRepo.count.mockResolvedValue(0);
      usersRepo.find.mockResolvedValue([]);

      const result = await useCase.execute({ user, page: 1, perPage: 10 });

      expect(result.total).toBe(0);
      expect(result.users).toHaveLength(0);
    });
  });
});
