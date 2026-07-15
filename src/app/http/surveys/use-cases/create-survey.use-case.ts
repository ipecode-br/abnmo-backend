import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectDataSource, InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';

import { RequestSignatureUseCase } from '@/app/signature/use-cases/request-signature.use-case';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Survey } from '@/domain/entities/survey';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { User } from '@/domain/entities/user';
import { EnvService } from '@/env/env.service';
import { formatCpfNumber } from '@/utils/formatters/format-cpf-number';

import { CreateSurveyBody } from '../surveys.dtos';

@Injectable()
@Log()
export class CreateSurveyUseCase {
  private readonly signatureModelKey: string;

  constructor(
    @InjectDataSource()
    private readonly dataSource: DataSource,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    @InjectRepository(Survey)
    private readonly surveysRepository: Repository<Survey>,
    private readonly requestSignatureUseCase: RequestSignatureUseCase,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.signatureModelKey = this.envService.get('SIGNATURE_MODEL_KEY');
  }

  async execute(input: CreateSurveyBody): Promise<void> {
    const submission = await this.surveySubmissionsRepository.findOne({
      where: { surveyToken: input.token },
      relations: { user: true },
    });

    if (!submission) {
      throw new NotFoundException('Token de catalogação inválido.', {
        cause: `Survey submission with token <${input.token}> not found`,
      });
    }

    if (submission.status !== 'approved') {
      throw new BadRequestException(
        'Esta catalogação não está aprovada para preenchimento.',
        {
          cause: `Survey submission <${input.token}> status is <${submission.status}>`,
        },
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

    let surveyId = '';

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
        status: 'pending_signature',
      });
      await surveysRepository.save(survey);

      surveyId = survey.id;

      await submissionsRepository.update(submission.id, {
        status: 'completed',
      });

      this.logger.log('Survey submitted', {
        id: submission.id,
        userId: submission.user.id,
        email: submission.user.email,
        cpf,
      });
    });

    const { signatureId } = await this.requestSignatureUseCase.execute({
      config: {
        name: `Catalogação ABNMO - ${submission.user.name}`,
        filename: 'termo-de-aceite-catalogacao-abnmo',
        subject: 'Termo de aceite para tratamento de dados - ABNMO',
        message:
          'Aceite os termos e assine o documento autorizando o tratamento dos seus dados de forma anônima.',
        notificationChannel: 'whatsapp',
        key: 'catalogacao-abnmo',
      },
      signer: {
        fullName: submission.user.name,
        email: submission.user.email,
        phone: submission.user.phone!,
        cpf: formatCpfNumber(cpf),
      },
      template: {
        key: this.signatureModelKey,
        data: { FULL_NAME: submission.user.name, CPF: cpf },
      },
    });

    if (signatureId) {
      await this.surveysRepository.update(surveyId, { signatureId });
      this.logger.log('Signature ID stored for survey', {
        id: surveyId,
        signatureId,
      });
    }
  }
}
