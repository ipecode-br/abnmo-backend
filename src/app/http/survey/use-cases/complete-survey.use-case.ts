import { randomBytes } from 'node:crypto';

import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/cryptography.service';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { CompleteSurveyBody } from '../survey.dtos';

@Injectable()
@Log()
export class CompleteSurveyUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly cryptographyService: CryptographyService,
    private readonly logger: LogService,
  ) {}

  async execute(input: CompleteSurveyBody): Promise<void> {
    const submission = await this.surveySubmissionsRepository.findOne({
      where: { id: input.token },
    });

    if (!submission) {
      throw new NotFoundException('Catalogação não encontrada.', {
        cause: `Survey submission "${input.token}" not found`,
      });
    }

    if (submission.status !== 'pending') {
      throw new BadRequestException(
        'Esta catalogação já foi finalizada ou está em um estado inválido.',
        {
          cause: `Survey submission "${input.token}" status is "${submission.status}"`,
        },
      );
    }

    const userWithSameEmail = await this.usersRepository.findOne({
      select: { id: true },
      where: { email: submission.email },
    });

    if (userWithSameEmail) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este e-mail.',
        { cause: `E-mail "${submission.email}" already exists` },
      );
    }

    const { susId, cpf, ...aboutYouData } = input.aboutYou;

    const userWithSameCpf = await this.usersRepository.findOne({
      select: { id: true },
      where: { cpf },
    });

    if (userWithSameCpf) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este CPF.',
        { cause: `CPF "${cpf}" already exists` },
      );
    }

    const surveyData = {
      ...aboutYouData,
      ...input.family,
      ...input.journey,
      ...input.diagnosis,
      ...input.followUp,
      ...input.dailyLife,
    };

    const randomPassword = randomBytes(16).toString('hex');
    const password = await this.cryptographyService.createHash(randomPassword);

    await this.dataSource.transaction(async (manager) => {
      const userDataSource = manager.getRepository(User);
      const surveyDataSource = manager.getRepository(Survey);
      const surveySubmissionsDataSource =
        manager.getRepository(SurveySubmission);

      const user = userDataSource.create({
        cpf,
        email: submission.email,
        name: submission.name,
        password,
        role: 'patient',
        susId,
      });
      await userDataSource.save(user);

      const survey = surveyDataSource.create({
        ...surveyData,
        userId: user.id,
        status: 'pending_signature',
      });
      await surveyDataSource.save(survey);

      await surveySubmissionsDataSource.update(submission.id, {
        status: 'completed',
      });

      this.logger.log('Survey completed', {
        id: submission.id,
        userId: user.id,
        email: user.email,
        cpf: user.cpf,
      });
    });

    // TODO: implement ClickSign signature integration
  }
}
