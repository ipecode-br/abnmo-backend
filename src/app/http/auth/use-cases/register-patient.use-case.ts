import { ConflictException, Injectable, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { Patient } from '@/domain/entities/patient';
import { Token } from '@/domain/entities/token';
import { AUTH_TOKENS_MAPPING } from '@/domain/enums/tokens';

import type { RegisterPatientDto } from '../auth.dtos';

interface RegisterPatientUseCaseRequest {
  registerPatientDto: RegisterPatientDto;
}

type RegisterPatientUseCaseResponse = Promise<{ accessToken: string }>;

@Injectable()
export class RegisterPatientUseCase {
  private readonly logger = new Logger(RegisterPatientUseCase.name);

  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectRepository(Token)
    private readonly tokensRepository: Repository<Token>,
    private readonly cryptographyService: CryptographyService,
  ) {}

  async execute({
    registerPatientDto,
  }: RegisterPatientUseCaseRequest): RegisterPatientUseCaseResponse {
    const { email, name, password } = registerPatientDto;

    const patient = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email },
    });

    if (patient) {
      this.logger.error(
        { email },
        'Patient registration failed: Email already registered',
      );
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail. Tente fazer login ou clique em "Esqueceu sua senha?" para recuperar o acesso.',
      );
    }

    const hashedPassword = await this.cryptographyService.createHash(password);

    const newPatient = await this.patientsRepository.save({
      password: hashedPassword,
      email,
      name,
    });

    this.logger.log(
      { patientId: newPatient.id, email },
      'Patient registered successfully',
    );

    const accessToken = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPING.access_token,
      { sub: newPatient.id, role: 'patient' },
      { expiresIn: '12h' },
    );

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 12);

    await this.tokensRepository.save({
      type: AUTH_TOKENS_MAPPING.access_token,
      entity_id: newPatient.id,
      expires_at: expiresAt,
      token: accessToken,
    });

    return { accessToken };
  }
}
