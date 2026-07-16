import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { SendReminderSignatureUseCase } from '@/app/signature/use-cases/send-reminder-signature.use-case';
import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Survey } from '@/domain/entities/survey';

interface SendSurveyReminderUseCaseInput {
  user: RequestUser;
  id: string;
}

@Injectable()
@Log()
export class SendSurveyReminderUseCase {
  constructor(
    @InjectRepository(Survey)
    private readonly surveysRepository: Repository<Survey>,
    private readonly sendReminderSignatureUseCase: SendReminderSignatureUseCase,
    private readonly logger: LogService,
  ) {}

  async execute({ user, id }: SendSurveyReminderUseCaseInput): Promise<void> {
    can(user, 'read:survey:others');

    const survey = await this.surveysRepository.findOne({
      relations: { user: true },
      where: { id },
      select: {
        id: true,
        status: true,
        signatureId: true,
        user: { name: true, email: true, phone: true, cpf: true },
      },
    });

    if (!survey) {
      throw new NotFoundException('Catalogação não encontrada.', {
        cause: `Survey with ID <${id}> not found`,
      });
    }

    if (survey.status !== 'pending_signature') {
      throw new BadRequestException(
        'Nenhuma assinatura pendente para esta catalogação.',
        { cause: `Survey with ID <${id}> has status <${survey.status}>` },
      );
    }

    if (!survey.signatureId) {
      throw new BadRequestException(
        'Nenhuma assinatura pendente para esta catalogação.',
        { cause: `Survey with ID <${id}> has no signatureId` },
      );
    }

    await this.sendReminderSignatureUseCase.execute({
      signatureId: survey.signatureId,
    });

    this.logger.log('Survey signature reminder sent', {
      id: survey.id,
      signatureId: survey.signatureId,
      patient: {
        name: survey.user.name,
        email: survey.user.email,
        phone: survey.user.phone,
        cpf: survey.user.cpf,
      },
    });
  }
}
