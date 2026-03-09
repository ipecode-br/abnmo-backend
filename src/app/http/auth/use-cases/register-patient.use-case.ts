import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';
import { UtilsService } from '@/utils/utils.service';

interface RegisterPatientUseCaseInput {
  name: string;
  email: string;
  password: string;
  response: Response;
}

// TODO: add all required fields to register a patient

@Injectable()
export class RegisterPatientUseCase {
  private readonly logger = new Logger(RegisterPatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly utilsService: UtilsService,
  ) {}

  async execute({
    name,
    email,
    password,
    response,
  }: RegisterPatientUseCaseInput): Promise<void> {
    const patientWithSameEmail = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (patientWithSameEmail) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail. Tente fazer login ou clique em "Esqueceu sua senha?" para recuperar o acesso.',
      );
    }

    const hashedPassword = await this.cryptographyService.createHash(password);

    const patient = await this.patientsRepository.save({
      name,
      email,
      password: hashedPassword,
    });

    const { maxAge, token } = await this.createTokenUseCase.execute({
      type: AUTH_TOKENS_MAPPING.accessToken,
      payload: { sub: patient.id, role: 'patient' },
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.accessToken,
      value: token,
      maxAge,
    });

    this.logger.log(
      { id: patient.id, email },
      'Patient registered successfully',
    );
  }
}
