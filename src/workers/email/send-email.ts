import { SendEmailJob } from '@/shared/queue/email.dto';

import { log } from './log';
import { sendViaResend } from './providers/resend';
import { sendViaSes } from './providers/ses';
import { buildCompleteSurveyEmail } from './templates/complete-survey';
import { buildDeclineSurveyEmail } from './templates/decline-survey';
import { buildRecoverPasswordEmail } from './templates/recover-password';
import { buildRegisterUserEmail } from './templates/register-user';
import { buildResetPasswordEmail } from './templates/reset-password';

const MAX_RETRIES = 3;

export async function sendEmail(job: SendEmailJob): Promise<void> {
  let rendered: { subject: string; html: string };

  switch (job.template) {
    case 'recoverPassword':
      rendered = buildRecoverPasswordEmail(job);
      break;
    case 'resetPassword':
      rendered = buildResetPasswordEmail(job);
      break;
    case 'registerUser':
      rendered = buildRegisterUserEmail(job);
      break;
    case 'completeSurvey':
      rendered = buildCompleteSurveyEmail(job);
      break;
    case 'declineSurvey':
      rendered = buildDeclineSurveyEmail(job);
      break;
    default: {
      const _exhaustive: never = job;
      throw new Error(
        `Unhandled email template: ${(_exhaustive as unknown as { template: string }).template}`,
      );
    }
  }

  const provider = process.env.EMAIL_PROVIDER ?? 'ses';
  const payload = { to: job.to, ...rendered };
  const send = provider === 'resend' ? sendViaResend : sendViaSes;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      await send(payload);

      log.info('Email sent', {
        to: job.to,
        template: job.template,
        provider,
        attempt: String(attempt),
      });

      return;
    } catch (err) {
      if (attempt === MAX_RETRIES) {
        log.error('Email send failed after retries', {
          to: job.to,
          template: job.template,
          provider,
          attempts: String(MAX_RETRIES),
          error: err instanceof Error ? err.message : String(err),
        });

        throw err;
      }

      await new Promise((resolve) => setTimeout(resolve, 2 ** attempt * 1000));
    }
  }
}
