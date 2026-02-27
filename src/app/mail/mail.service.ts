import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable, Logger } from '@nestjs/common';
import { Resend } from 'resend';

import { EnvService } from '@/env/env.service';

@Injectable()
export class MailService {
  private readonly logger = new Logger(MailService.name);
  private readonly isEnable: boolean;
  private readonly emailProvider: 'ses' | 'resend';
  private readonly sesClient: SESClient;
  private readonly resendClient: Resend;

  constructor(private envService: EnvService) {
    this.isEnable = this.envService.get('ENABLE_EMAILS');
    this.emailProvider = this.envService.get('EMAIL_PROVIDER');
    this.resendClient = new Resend(this.envService.get('RESEND_KEY'));
    this.sesClient = new SESClient({
      region: this.envService.get('AWS_SES_REGION'),
      credentials: {
        accessKeyId: this.envService.get('AWS_SES_ACCESS_KEY_ID'),
        secretAccessKey: this.envService.get('AWS_SES_SECRET_ACCESS_KEY'),
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
        'Send e-mail skipped ("ENABLE_EMAILS" is set to "false")',
      );
      return true;
    }

    if (this.emailProvider === 'resend') {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from: 'SVM | ABNMO <naoresponda@abnmo.org>',
          to,
          subject,
          html: htmlBody,
          text: textBody,
        });

        if (error) {
          this.logger.error(
            { provider: this.emailProvider, to, subject, error },
            'Send e-mail failed',
          );
          return false;
        }

        this.logger.log(
          { provider: this.emailProvider, to, subject, messageId: data.id },
          'E-mail sent successfully',
        );
        return true;
      } catch (error) {
        this.logger.error(
          // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
          { provider: this.emailProvider, to, subject, error },
          'Send e-mail failed',
        );
        return false;
      }
    }

    const sendCommand = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: {
          Html: { Charset: 'UTF-8', Data: htmlBody },
          ...(textBody && { Text: { Charset: 'UTF-8', Data: textBody } }),
        },
        Subject: { Charset: 'UTF-8', Data: subject },
      },
      Source: 'SVM | ABNMO <naoresponda@abnmo.org>',
    });

    try {
      const result = await this.sesClient.send(sendCommand);
      this.logger.log(
        {
          provider: this.emailProvider,
          to,
          subject,
          messageId: result.MessageId,
          attempts: result.$metadata.attempts,
        },
        'E-mail sent successfully',
      );
      return true;
    } catch (error) {
      this.logger.error(
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
        { provider: this.emailProvider, to, subject, error },
        'Send e-mail failed',
      );
      return false;
    }
  }
}
