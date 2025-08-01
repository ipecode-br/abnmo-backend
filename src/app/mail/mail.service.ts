import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';

import { EnvService } from '@/env/env.service';

@Injectable()
export class MailService {
  private readonly sesClient: SESClient;
  private readonly logger = new Logger(MailService.name);
  private readonly fromEmail: string;

  constructor(private envService: EnvService) {
    this.fromEmail = this.envService.get('AWS_SES_FROM_EMAIL');

    this.sesClient = new SESClient({
      region: this.envService.get('AWS_REGION'),
      credentials: {
        accessKeyId: this.envService.get('AWS_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SECRET_ACCESS_KEY'),
      },
    });
  }

  async sendEmail(
    to: string,
    subject: string,
    htmlBody: string,
    textBody?: string,
  ) {
    const command = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: {
          Html: { Charset: 'UTF-8', Data: htmlBody },
          ...(textBody && { Text: { Charset: 'UTF-8', Data: textBody } }),
        },
        Subject: { Charset: 'UTF-8', Data: subject },
      },
      Source: `SMV | ABNMO <${this.fromEmail}>`,
    });

    try {
      const result = await this.sesClient.send(command);
      this.logger.log(
        { to, subject, messageId: result.MessageId },
        'E-mail sent successfully',
      );
      return result;
    } catch (error) {
      this.logger.error(`Failed to send email to ${to}`, error);
      throw error;
    }
  }
}
