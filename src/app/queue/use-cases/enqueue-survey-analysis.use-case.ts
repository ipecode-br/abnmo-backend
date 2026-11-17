import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Injectable } from '@nestjs/common';
import * as Sentry from '@sentry/nestjs';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import type { MessageEnvelope } from '@/shared/queue/envelope';
import type { AnalyzeSurveyAnswerJob } from '@/shared/queue/schemas/survey-analysis';
import { generateQueueIdempotencyKey } from '@/shared/queue/utils';

@Injectable()
@Log()
export class EnqueueSurveyAnalysisUseCase {
  private readonly queueUrl: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly sqs: SQSClient,
  ) {
    this.queueUrl = this.envService.get('SURVEY_ANALYSIS_QUEUE_URL');
  }

  async execute(job: AnalyzeSurveyAnswerJob): Promise<void> {
    const message: MessageEnvelope<AnalyzeSurveyAnswerJob> = {
      version: 1,
      type: 'survey-analysis',
      payload: job,
      idempotencyKey: generateQueueIdempotencyKey(),
    };

    try {
      await this.sqs.send(
        new SendMessageCommand({
          QueueUrl: this.queueUrl,
          MessageBody: JSON.stringify(message),
        }),
      );

      this.logger.log('Survey analysis job enqueued', {
        patientId: job.patientId,
        questionKey: job.questionKey,
        model: job.model,
      });
    } catch (error) {
      this.logger.error('Failed to enqueue survey analysis job', {
        patientId: job.patientId,
        questionKey: job.questionKey,
        model: job.model,
        error: error instanceof Error ? error.message : String(error),
      });

      Sentry.captureException(error, {
        captureContext: {
          level: 'error',
          extra: { patientId: job.patientId, questionKey: job.questionKey },
        },
      });
    }
  }
}
