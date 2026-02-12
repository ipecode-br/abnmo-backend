import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';

import { EnvService } from '@/env/env.service';

@Injectable()
export class MailService {
  private readonly sesClient: SESClient;
  private readonly logger = new Logger(MailService.name);
  private readonly isEnable: boolean;

  constructor(private envService: EnvService) {
    this.isEnable = this.envService.get('ENABLE_EMAILS');

    this.sesClient = new SESClient({
      region: this.envService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async send({
    to,
    subject,
    htmlBody,
    textBody,
  }: {
    to: string;
    subject: string;
    htmlBody: string;
    textBody?: string;
  }) {
    if (!this.isEnable) {
      this.logger.log(
        { to, subject },
        'E-mail sender skipped. "ENABLE_EMAILS" is set to false',
      );
      return true;
    }

    const command = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: {
          Html: { Charset: 'UTF-8', Data: htmlBody },
          ...(textBody && { Text: { Charset: 'UTF-8', Data: textBody } }),
        },
        Subject: { Charset: 'UTF-8', Data: subject },
      },
      Source: `SVM | ABNMO <naoresponda@abnmo.org>`,
    });

    try {
      const result = await this.sesClient.send(command);
      this.logger.log(
        {
          to,
          subject,
          messageId: result.MessageId,
          attempts: result.$metadata.attempts,
        },
        'E-mail sent successfully',
      );
      return true;
    } catch (error) {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      this.logger.error({ to, subject, error }, 'Send e-mail failed');
      return false;
    }
  }
}
