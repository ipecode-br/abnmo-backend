import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { memberUserFactory } from 'tests/config/factories/user.factory';
import { DataSource, Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { RecoverPasswordUseCase } from '@/app/http/auth/use-cases/recover-password.use-case';
import { EnqueueEmailUseCase } from '@/app/queue/use-cases/enqueue-email.use-case';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';

describe('RecoverPasswordUseCase', () => {
  let useCase: RecoverPasswordUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let tokensRepo: MockProxy<Repository<Token>>;
  let createTokenUseCase: MockProxy<CreateTokenUseCase>;
  let envService: MockProxy<EnvService>;
  let enqueueEmailUseCase: MockProxy<EnqueueEmailUseCase>;
  let dataSource: MockProxy<DataSource>;

  const existingUser = memberUserFactory();

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    tokensRepo = mock<Repository<Token>>();
    createTokenUseCase = mock<CreateTokenUseCase>();
    envService = mock<EnvService>();
    enqueueEmailUseCase = mock<EnqueueEmailUseCase>();
    dataSource = mock<DataSource>();

    envService.get.mockReturnValue('https://app.test.com');

    dataSource.transaction.mockImplementation(async (cb: any) => {
      const manager = { getRepository: jest.fn().mockReturnValue(tokensRepo) };
      return cb(manager);
    });

    const module = await Test.createTestingModule({
      providers: [
        RecoverPasswordUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Token), useValue: tokensRepo },
        { provide: CreateTokenUseCase, useValue: createTokenUseCase },
        { provide: EnvService, useValue: envService },
        { provide: LogService, useValue: { log: jest.fn(), warn: jest.fn() } },
        { provide: EnqueueEmailUseCase, useValue: enqueueEmailUseCase },
        { provide: DataSource, useValue: dataSource },
      ],
    }).compile();

    useCase = module.get(RecoverPasswordUseCase);
  });

  it('generates token and sends email for existing user', async () => {
    usersRepo.findOne.mockResolvedValue(existingUser);
    createTokenUseCase.execute.mockResolvedValue({
      token: 'generated-token',
      maxAge: 3600000,
      expiresAt: new Date(),
    });

    await useCase.execute({ email: existingUser.email });

    expect(usersRepo.findOne).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: existingUser.email } }),
    );
    expect(createTokenUseCase.execute).toHaveBeenCalled();
    expect(tokensRepo.delete).toHaveBeenCalledWith({
      userId: existingUser.id,
    });
    expect(tokensRepo.save).toHaveBeenCalled();
    expect(enqueueEmailUseCase.execute).toHaveBeenCalledWith(
      expect.objectContaining({
        template: 'recoverPassword',
        to: existingUser.email,
        name: existingUser.name.split(' ')[0],
        resetPasswordUrl: expect.stringContaining('/nova-senha?token='),
      }),
    );
  });

  it('does nothing (no error) for non-existent email', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'notfound@test.com' }),
    ).resolves.toBeUndefined();

    expect(enqueueEmailUseCase.execute).not.toHaveBeenCalled();
    expect(createTokenUseCase.execute).not.toHaveBeenCalled();
  });
});
