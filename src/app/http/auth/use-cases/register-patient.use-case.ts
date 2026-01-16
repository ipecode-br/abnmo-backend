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

import type { RegisterPatientDto } from '../auth.dtos';

interface RegisterPatientUseCaseInput {
  registerPatientDto: RegisterPatientDto;
  response: Response;
}

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
    registerPatientDto,
    response,
  }: RegisterPatientUseCaseInput): Promise<void> {
    const { email, name } = registerPatientDto;

    const patientWithSameEmail = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (patientWithSameEmail) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail. Tente fazer login ou clique em "Esqueceu sua senha?" para recuperar o acesso.',
      );
    }

    const password = await this.cryptographyService.createHash(
      registerPatientDto.password,
    );

    const patient = this.patientsRepository.create({ name, email, password });

    await this.patientsRepository.save(patient);

    this.logger.log(
      { patientId: patient.id, email },
      'Patient registered successfully',
    );

    const { maxAge, token } = await this.createTokenUseCase.execute({
      type: AUTH_TOKENS_MAPPING.access_token,
      payload: { sub: patient.id, accountType: 'patient' },
    });

    this.utilsService.setCookie(response, {
      name: COOKIES_MAPPING.access_token,
      value: token,
      maxAge,
    });
  }
}
