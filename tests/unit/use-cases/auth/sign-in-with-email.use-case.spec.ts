import { ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import type { Response } from 'express';
import { mock, MockProxy } from 'jest-mock-extended';
import {
  memberUserFactory,
  patientUserFactory,
} from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { CreateSessionUseCase } from '@/app/http/auth/use-cases/create-session.use-case';
import { SignInWithEmailUseCase } from '@/app/http/auth/use-cases/sign-in-with-email.use-case';
import { LogService } from '@/common/log/log.service';
import { User } from '@/domain/entities/user';

describe('SignInWithEmailUseCase', () => {
  let useCase: SignInWithEmailUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let createSessionUseCase: MockProxy<CreateSessionUseCase>;
  let cryptographyService: MockProxy<CryptographyService>;

  const activeMember = memberUserFactory({ status: 'active' });
  const inactiveMember = memberUserFactory({ status: 'inactive' });
  const activePatient = patientUserFactory({ status: 'active' });

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
    usersRepo.findOne.mockResolvedValue(activeMember);
    cryptographyService.compareHash.mockResolvedValue(true);

    const result = await useCase.execute({
      email: activeMember.email,
      password: 'secret',
      keepLoggedIn: false,
      response: mockResponse(),
    });

    expect(result).toEqual({ role: activeMember.role });
    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: activeMember.email } }),
    );
    expect(createSessionUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        user: {
          id: activeMember.id,
          email: activeMember.email,
          role: activeMember.role,
        },
        keepLoggedIn: false,
      }),
    );
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
    usersRepo.findOne.mockResolvedValue(activeMember);
    cryptographyService.compareHash.mockResolvedValue(false);

    await expect(
      useCase.execute({
        email: activeMember.email,
        password: 'wrong',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });

  it('throws ForbiddenException for inactive user', async () => {
    usersRepo.findOne.mockResolvedValue(inactiveMember);
    cryptographyService.compareHash.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: inactiveMember.email,
        password: 'secret',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(ForbiddenException);
  });

  it('throws UnauthorizedException for patient role', async () => {
    usersRepo.findOne.mockResolvedValue(activePatient);
    cryptographyService.compareHash.mockResolvedValue(true);

    await expect(
      useCase.execute({
        email: activePatient.email,
        password: 'secret',
        keepLoggedIn: false,
        response: mockResponse(),
      }),
    ).rejects.toThrow(UnauthorizedException);
  });
});
