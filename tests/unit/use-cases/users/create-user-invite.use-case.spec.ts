import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { CreateUserInviteUseCase } from '@/app/http/users/use-cases/create-user-invite.use-case';
import { MailService } from '@/app/mail/mail.service';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { TOKENS } from '@/domain/enums/tokens';
import { EnvService } from '@/env/env.service';

describe('CreateUserInviteUseCase', () => {
  let useCase: CreateUserInviteUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let tokensRepo: MockProxy<Repository<Token>>;
  let createTokenUseCase: MockProxy<CreateTokenUseCase>;
  let dataSource: { transaction: jest.Mock };
  let envService: MockProxy<EnvService>;
  let mailService: MockProxy<MailService>;

  const user: RequestUser = {
    id: 'admin-id',
    email: 'admin@test.com',
    role: 'admin',
    features: [],
  };

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    tokensRepo = mock<Repository<Token>>();
    createTokenUseCase = mock<CreateTokenUseCase>();
    envService = mock<EnvService>();
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
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Token), useValue: tokensRepo },
        { provide: CreateTokenUseCase, useValue: createTokenUseCase },
        { provide: DataSource, useValue: dataSource },
        { provide: EnvService, useValue: envService },
        { provide: LogService, useValue: { log: jest.fn() } },
        { provide: MailService, useValue: mailService },
      ],
    }).compile();

    useCase = module.get(CreateUserInviteUseCase);
  });

  it('creates invite when email is not taken', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    tokensRepo.findOne.mockResolvedValue(null);
    createTokenUseCase.execute.mockResolvedValue({
      token: 'invite-token-abc',
      maxAge: 28800000,
      expiresAt: new Date('2025-12-31'),
    });

    await useCase.execute({ user, email: 'newuser@test.com', role: 'member' });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { email: 'newuser@test.com' },
        select: { id: true },
      }),
    );
    expect(tokensRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: 'newuser@test.com' } }),
    );
    expect(createTokenUseCase.execute).toHaveBeenCalledWith({
      type: TOKENS.inviteUser,
      payload: { role: 'member' },
    });
    expect(mailService.send).toHaveBeenCalled();
  });

  it('allows invite when existing token is expired', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    const pastDate = new Date();
    pastDate.setDate(pastDate.getDate() - 1);
    tokensRepo.findOne.mockResolvedValue({
      expiresAt: pastDate,
    } as Token);

    createTokenUseCase.execute.mockResolvedValue({
      token: 'invite-token-xyz',
      maxAge: 28800000,
      expiresAt: new Date('2025-12-31'),
    });

    await useCase.execute({
      user,
      email: 'expired@test.com',
      role: 'specialist',
    });

    expect(createTokenUseCase.execute).toHaveBeenCalled();
    expect(mailService.send).toHaveBeenCalled();
  });

  it('builds the correct register URL and sends email', async () => {
    usersRepo.findOne.mockResolvedValue(null);
    tokensRepo.findOne.mockResolvedValue(null);
    createTokenUseCase.execute.mockResolvedValue({
      token: 'invite-token-abc',
      maxAge: 28800000,
      expiresAt: new Date('2025-12-31'),
    });

    await useCase.execute({ user, email: 'newuser@test.com', role: 'admin' });

    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'newuser@test.com',
        html: expect.stringContaining(
          '/conta/cadastrar?token=invite-token-abc',
        ),
      }),
    );
  });

  describe('Edge cases', () => {
    it('throws "ConflictException" when email already has an active user', async () => {
      usersRepo.findOne.mockResolvedValue({ id: 'existing-id' } as User);

      await expect(
        useCase.execute({ user, email: 'existing@test.com', role: 'member' }),
      ).rejects.toThrow(ConflictException);

      expect(createTokenUseCase.execute).not.toHaveBeenCalled();
    });

    it('throws "ConflictException" when active invite token exists', async () => {
      usersRepo.findOne.mockResolvedValue(null);
      const futureDate = new Date();
      futureDate.setDate(futureDate.getDate() + 1);
      tokensRepo.findOne.mockResolvedValue({
        expiresAt: futureDate,
      } as Token);

      await expect(
        useCase.execute({ user, email: 'invited@test.com', role: 'member' }),
      ).rejects.toThrow(ConflictException);

      expect(createTokenUseCase.execute).not.toHaveBeenCalled();
    });
  });
});
