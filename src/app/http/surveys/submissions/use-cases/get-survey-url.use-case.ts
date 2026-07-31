import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import type { RequestUser } from '@/common/types';
import { SurveySubmission } from '@/domain/entities/survey-submission';
import { EnvService } from '@/env/env.service';

interface GetSurveyUrlUseCaseInput {
  user: RequestUser;
  id: string;
}

interface GetSurveyUrlUseCaseOutput {
  url: string;
}

@Injectable()
export class GetSurveyUrlUseCase {
  private readonly dashboardUrl: string;

  constructor(
    @InjectRepository(SurveySubmission)
    private readonly surveySubmissionsRepository: Repository<SurveySubmission>,
    private readonly envService: EnvService,
  ) {
    this.dashboardUrl = this.envService.get('DASHBOARD_URL');
  }

  async execute({
    user,
    id,
  }: GetSurveyUrlUseCaseInput): Promise<GetSurveyUrlUseCaseOutput> {
    can(user, 'review:survey');

    const submission = await this.surveySubmissionsRepository.findOne({
      select: { id: true, status: true, surveyToken: true },
      where: { id },
    });

    if (!submission) {
      throw new NotFoundException('Submissão de catalogação não encontrada.', {
        cause: `Survey submission with ID <${id}> not found`,
      });
    }

    if (submission.status !== 'approved') {
      throw new BadRequestException('A submissão ainda não foi aprovada.', {
        cause: `Survey submission with ID <${id}> has status "${submission.status}", expected "approved"`,
      });
    }

    const url = `${this.dashboardUrl}/catalogacao/voce?token=${submission.surveyToken}`;

    return { url };
  }
}
