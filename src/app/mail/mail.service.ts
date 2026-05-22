import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';
import { Injectable } from '@nestjs/common';
import { Resend } from 'resend';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { Env } from '@/env/env';
import { EnvService } from '@/env/env.service';

@Injectable()
@Log()
export class MailService {
  private readonly isEnable: boolean;
  private readonly emailProvider: Env['EMAIL_PROVIDER'];
  private readonly sesClient: SESClient;
  private readonly resendClient: Resend;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.emailProvider = this.envService.get('EMAIL_PROVIDER');
    this.isEnable = this.emailProvider !== 'none';
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
    html,
    text,
  }: {
    to: string;
    subject: string;
    html: string;
    text?: string;
  }) {
    if (!this.isEnable) {
      this.logger.log(
        'Send e-mail skipped ("EMAIL_PROVIDER" is set to "none")',
        { to, subject },
      );

      return true;
    }

    const provider = this.emailProvider;
    const from = 'SVM | ABNMO <naoresponda@abnmo.org>';

    if (provider === 'resend') {
      try {
        const { data, error } = await this.resendClient.emails.send({
          from,
          to,
          subject,
          html,
          text,
        });

        if (error) {
          this.logger.error('Send e-mail failed', {
            provider,
            to,
            subject,
            error,
          });
          return false;
        }

        this.logger.log('E-mail sent successfully', {
          provider,
          to,
          subject,
          messageId: data.id,
        });
        return true;
      } catch (error: unknown) {
        this.logger.error('Send e-mail failed', {
          provider,
          to,
          subject,
          error,
        });
        return false;
      }
    }

    const sendCommand = new SendEmailCommand({
      Destination: { ToAddresses: [to] },
      Message: {
        Body: {
          Html: { Charset: 'UTF-8', Data: html },
          ...(text && { Text: { Charset: 'UTF-8', Data: text } }),
        },
        Subject: { Charset: 'UTF-8', Data: subject },
      },
      Source: from,
    });

    try {
      const result = await this.sesClient.send(sendCommand);
      this.logger.log('E-mail sent successfully', {
        provider,
        to,
        subject,
        messageId: result.MessageId,
        attempts: result.$metadata.attempts,
      });
      return true;
    } catch (error: unknown) {
      this.logger.error('Send e-mail failed', { provider, to, subject, error });
      return false;
    }
  }
}
