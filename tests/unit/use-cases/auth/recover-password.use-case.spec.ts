import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { memberUserFactory } from 'tests/config/factories/user.factory';
import { Repository } from 'typeorm';

import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { RecoverPasswordUseCase } from '@/app/http/auth/use-cases/recover-password.use-case';
import { MailService } from '@/app/mail/mail.service';
import { LogService } from '@/common/log/log.service';
import { Token } from '@/domain/entities/token';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';

jest.mock('@/domain/email-templates/recover-password-email', () => ({
  buildRecoverPasswordEmail: jest.fn().mockReturnValue('<html>recover</html>'),
}));

describe('RecoverPasswordUseCase', () => {
  let useCase: RecoverPasswordUseCase;
  let usersRepo: MockProxy<Repository<User>>;
  let tokensRepo: MockProxy<Repository<Token>>;
  let createTokenUseCase: MockProxy<CreateTokenUseCase>;
  let envService: MockProxy<EnvService>;
  let mailService: MockProxy<MailService>;

  const existingUser = memberUserFactory();

  beforeEach(async () => {
    usersRepo = mock<Repository<User>>();
    tokensRepo = mock<Repository<Token>>();
    createTokenUseCase = mock<CreateTokenUseCase>();
    envService = mock<EnvService>();
    mailService = mock<MailService>();

    envService.get.mockReturnValue('https://app.test.com');

    const module = await Test.createTestingModule({
      providers: [
        RecoverPasswordUseCase,
        { provide: getRepositoryToken(User), useValue: usersRepo },
        { provide: getRepositoryToken(Token), useValue: tokensRepo },
        { provide: CreateTokenUseCase, useValue: createTokenUseCase },
        { provide: EnvService, useValue: envService },
        { provide: LogService, useValue: { log: jest.fn(), warn: jest.fn() } },
        { provide: MailService, useValue: mailService },
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
      entityId: existingUser.id,
    });
    expect(tokensRepo.save).toHaveBeenCalled();
    expect(mailService.send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: existingUser.email,
        subject: 'Solicitação para redefinição de senha',
      }),
    );
  });

  it('does nothing (no error) for non-existent email', async () => {
    usersRepo.findOne.mockResolvedValue(null);

    await expect(
      useCase.execute({ email: 'notfound@test.com' }),
    ).resolves.toBeUndefined();

    expect(mailService.send).not.toHaveBeenCalled();
    expect(createTokenUseCase.execute).not.toHaveBeenCalled();
  });
});
