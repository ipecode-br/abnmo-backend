import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

import { CreateSessionUseCase } from '../use-cases/create-session.use-case';
import { SignInWithEmailUseCase } from '../use-cases/sign-in-with-email.use-case';

describe('SignInWithEmailUseCase', () => {
  let useCase: SignInWithEmailUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let createSessionUseCase: MockProxy<CreateSessionUseCase>;
  let cryptographyService: MockProxy<CryptographyService>;

  const mockResponse = () => ({}) as Response;

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    createSessionUseCase = mock<CreateSessionUseCase>();
    cryptographyService = mock<CryptographyService>();

    const module = await Test.createTestingModule({
      providers: [
        SignInWithEmailUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: CreateSessionUseCase, useValue: createSessionUseCase },
        { provide: CryptographyService, useValue: cryptographyService },
        { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(SignInWithEmailUseCase);
  });

  it('successful login for active non-patient user', async () => {
    const user = {
      id: 'user-1',
      email: 'member@test.com',
      password: 'hashed',
      role: 'member' as const,
      status: 'active' as const,
    };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(true);

    const result = await useCase.execute({
      email: 'member@test.com',
      password: 'secret',
      keepLoggedIn: false,
      response: mockResponse(),
    });

    expect(result).toEqual({ role: 'member' });
    expect(createSessionUseCase.execute).toHaveBeenCalledWith({
      user: { id: 'user-1', email: 'member@test.com', role: 'member' },
      keepLoggedIn: false,
      response: expect.any(Object),
    });
  });

  it('throws UnauthorizedException for invalid email', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({
        email: 'notfound@test.com',
        password: 'secret',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws UnauthorizedException for wrong password', async () => {
    const user = {
      id: 'user-1',
      email: 'member@test.com',
      password: 'hashed',
      role: 'member' as const,
      status: 'active' as const,
    };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: 'member@test.com',
        password: 'wrong',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException for inactive user', async () => {
    const user = {
      id: 'user-1',
      email: 'inactive@test.com',
      password: 'hashed',
      role: 'member' as const,
      status: 'inactive' as const,
    };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: 'inactive@test.com',
        password: 'secret',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException for patient role', async () => {
    const user = {
      id: 'user-1',
      email: 'patient@test.com',
      password: 'hashed',
      role: 'patient' as const,
      status: 'active' as const,
    };
    usersRepo.findOne.mockResolvedValue(user as unknown as User);
    cryptographyService.compareHash.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: 'patient@test.com',
        password: 'secret',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
