import { ConflictException, Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Response } from 'express';
import { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Patient } from '@/domain/entities/patient';

interface RegisterPatientUseCaseInput {
  name: string;
  email: string;
  password: string;
  response: Response;
}

// TODO: review this endpoint

@Injectable()
@Log()
export class RegisterPatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly cryptographyService: CryptographyService,
    private readonly logger: LogService,
  ) {}

  async execute({
    name,
    email,
    password,
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

    this.logger.log('Patient registered', { id: patient.id, email });
  }
}
