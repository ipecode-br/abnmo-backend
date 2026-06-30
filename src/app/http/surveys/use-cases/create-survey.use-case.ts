import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';

import { CreateSurveyBody } from '../surveys.dtos';

@Injectable()
@Log()
export class CreateSurveyUseCase {
  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly logger: LogService,
  ) {}

  async execute(input: CreateSurveyBody): Promise<void> {
    const submission = await this.surveySubmissionsRepository.findOne({
      where: { id: input.token },
      relations: { user: true },
    });

    if (!submission) {
      throw new NotFoundException('Catalogação não encontrada.', {
        cause: `Survey submission <${input.token}> not found`,
      });
    }

    if (submission.status !== 'pending') {
      throw new BadRequestException(
        'Esta catalogação já foi finalizada ou está em um estado inválido.',
        {
          cause: `Survey submission <${input.token}> status is "${submission.status}"`,
        },
      );
    }

    const { susId, cpf, ...aboutYouData } = input.aboutYou;

    const userWithSameCpf = await this.usersRepository.findOne({
      select: { id: true },
      where: { cpf },
    });

    if (userWithSameCpf?.cpf === submission.user.cpf) {
      throw new ConflictException(
        'Já existe uma conta cadastrada com este CPF.',
        { cause: `CPF <${cpf}> already exists` },
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

    await this.dataSource.transaction(async (manager) => {
      const usersRepository = manager.getRepository(User);
      const surveysRepository = manager.getRepository(Survey);
      const submissionsRepository = manager.getRepository(SurveySubmission);

      await usersRepository.update(submission.user.id, {
        cpf,
        susId,
        supportContacts: input.supportContacts,
        status: 'active',
      });

      const survey = surveysRepository.create({
        ...surveyData,
        userId: submission.user.id,
        status: 'pending_signature',
      });
      await surveysRepository.save(survey);

      await submissionsRepository.update(submission.id, {
        status: 'completed',
      });

      this.logger.log('Survey completed', {
        id: submission.id,
        userId: submission.user.id,
        email: submission.user.email,
        cpf,
      });
    });

    // TODO: implement ClickSign signature integration
  }
}
