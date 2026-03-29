import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { CreateTokenUseCase } from '@/app/cryptography/use-cases/create-token.use-case';
import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import { COOKIES_MAPPING } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

interface RegisterPatientUseCaseInput {
  name: string;
  email: string;
  password: string;
  response: Response;
}

// TODO: add all required fields to register a patient

@Logger()
@Injectable()
export class RegisterPatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly createTokenUseCase: CreateTokenUseCase,
    private readonly cryptographyService: CryptographyService,
    private readonly logger: AppLogger,
  ) {}

  async execute({
    name,
    email,
    password,
    response,
  }: RegisterPatientUseCaseInput): Promise<void> {
    this.logger.setEvent('register_patient');

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

    this.cryptographyService.setCookie(response, {
      name: COOKIES_MAPPING.accessToken,
      value: token,
      maxAge,
    });

    this.logger.log('Patient registered successfully', {
      id: patient.id,
      email,
    });
  }
}
