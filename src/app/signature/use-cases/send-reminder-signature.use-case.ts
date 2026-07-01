import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';

import { SignatureService } from '../signature.service';

interface SendReminderSignatureUseCaseInput {
  signatureId: string;
  message?: string;
}

interface SendReminderSignatureUseCaseOutput {
  notified: boolean;
}

@Injectable()
@Log()
export class SendReminderSignatureUseCase {
  private readonly isEnabled: boolean;

  constructor(
    private readonly signatureService: SignatureService,
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.isEnabled = this.envService.get('SIGNATURE_ENABLED');
  }

  async execute(
    input: SendReminderSignatureUseCaseInput,
  ): Promise<SendReminderSignatureUseCaseOutput> {
    if (!this.isEnabled) {
      this.logger.log('Signature disabled — reminder bypassed', {
        signatureId: input.signatureId,
      });
      return { notified: false };
    }

    await this.signatureService.api(
      `/envelopes/${input.signatureId}/notifications`,
      {
        method: 'POST',
        data: {
          type: 'notifications',
          attributes: { message: input.message },
        },
      },
    );

    this.logger.log('Signature reminder sent', {
      signatureId: input.signatureId,
    });

    return { notified: true };
  }
}
