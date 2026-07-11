import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { MailService } from '@/app/mail/mail.service';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { EnvService } from '@/env/env.service';

import { CreateUserInviteUseCase } from '../use-cases/create-user-invite.use-case';

describe('CreateUserInviteUseCase', () => {
  let useCase: CreateUserInviteUseCase;
  let userRepo: MockProxy<Repository<User>>;
  let tokenRepo: MockProxy<Repository<Token>>;
  let createTokenUseCase: MockProxy<CreateTokenUseCase>;
  let dataSource: { transaction: jest.Mock };
  let envService: MockProxy<EnvService>;
  let logger: { log: jest.Mock };
  let mailService: MockProxy<MailService>;

  beforeEach(async () => {
    userRepo = mock<Repository<User>>();
    tokenRepo = mock<Repository<Token>>();
    createTokenUseCase = mock<CreateTokenUseCase>();
    envService = mock<EnvService>();
    logger = { log: jest.fn() };
    mailService = mock<MailService>();

    const transactionTokenRepo = mock<Repository<Token>>();
    transactionTokenRepo.create.mockImplementation(
      (entity: any) => entity as Token,
    );

    dataSource = {
      transaction: jest.fn().mockImplementation(async (cb: any) => {
        const manager = {
          getRepository: jest.fn().mockReturnValue(transactionTokenRepo),
        };
        return cb(manager);
      }),
    };

    envService.get.mockReturnValue('https://app.example.com');

    const module = await Test.createTestingModule({
      providers: [
        CreateUserInviteUseCase,
        { provide: getRepositoryToken(User), useValue: userRepo },
        { provide: getRepositoryToken(Token), useValue: tokenRepo },
        { provide: CreateTokenUseCase, useValue: createTokenUseCase },
        { provide: DataSource, useValue: dataSource },
        { provide: EnvService, useValue: envService },
        { provide: LogService, useValue: logger },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    useCase = module.get(CreateUserInviteUseCase);
  });

  it('creates invite successfully', async () => {
    userRepo.findOne.mockResolvedValue(null);
    tokenRepo.findOne.mockResolvedValue(null);
    createTokenUseCase.execute.mockResolvedValue({
      token: 'invite-token-abc',
      maxAge: 28800000,
      expiresAt: new Date('2025-12-31'),
    });

    await useCase.execute({ email: 'newuser@test.com', role: 'member' });

    expect(userRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'newuser@test.com' },
      select: { id: true },
    });
    expect(tokenRepo.findOne).toHaveBeenCalledWith({
      where: { email: 'newuser@test.com' },
    });
    expect(createTokenUseCase.execute).toHaveBeenCalledWith({
      type: AUTH_TOKENS_MAPPING.inviteUser,
      payload: { role: 'member' },
    });
    expect(mailService.send).toHaveBeenCalled();
    expect(logger.log).toHaveBeenCalled();
  });

  it('throws ConflictException when email already has an active user', async () => {
    userRepo.findOne.mockResolvedValue({ id: 'existing-id' } as User);

    await expect(
      useCase.execute({ email: 'existing@test.com', role: 'member' }),
    ).rejects.toThrow(ConflictException);
    expect(createTokenUseCase.execute).not.toHaveBeenCalled();
  });

  it('throws ConflictException when active invite token exists', async () => {
    userRepo.findOne.mockResolvedValue(null);
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 1);

    tokenRepo.findOne.mockResolvedValue({
      expiresAt: futureDate,
    } as Token);

    await expect(
      useCase.execute({ email: 'invited@test.com', role: 'member' }),
    ).rejects.toThrow(ConflictException);
    expect(createTokenUseCase.execute).not.toHaveBeenCalled();
  });

  it('allows invite when existing token is expired', async () => {
    userRepo.findOne.mockResolvedValue(null);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);

    tokenRepo.findOne.mockResolvedValue({
      expiresAt: pastDate,
    } as Token);

    createTokenUseCase.execute.mockResolvedValue({
      token: 'invite-token-xyz',
      maxAge: 28800000,
      expiresAt: new Date('2025-12-31'),
    });

    await useCase.execute({ email: 'expired@test.com', role: 'specialist' });

    expect(createTokenUseCase.execute).toHaveBeenCalled();
    expect(mailService.send).toHaveBeenCalled();
  });

  it('builds the correct register URL and sends email', async () => {
    userRepo.findOne.mockResolvedValue(null);
    tokenRepo.findOne.mockResolvedValue(null);
    createTokenUseCase.execute.mockResolvedValue({
      token: 'invite-token-abc',
      maxAge: 28800000,
      expiresAt: new Date('2025-12-31'),
    });

    await useCase.execute({ email: 'newuser@test.com', role: 'admin' });

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'newuser@test.com',
        html: expect.stringContaining(
          '/conta/cadastrar?token=invite-token-abc',
        ),
      }),
    );
  });
});
