import { SendEmailJob } from '@/shared/queue/email.dto';
import { anonymizeEmail } from '@/utils/anonymize';

import { env } from './env';
import { log } from './log';
import { sendViaResend } from './providers/resend';
import { sendViaSes } from './providers/ses';
import { buildCompleteSurveyEmail } from './templates/complete-survey';
import { buildDeclineSurveyEmail } from './templates/decline-survey';
import { buildRecoverPasswordEmail } from './templates/recover-password';
import { buildRegisterUserEmail } from './templates/register-user';
import { buildResetPasswordEmail } from './templates/reset-password';

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

  const payload = { to: job.to, ...rendered };

  try {
    await (env.EMAIL_PROVIDER === 'resend'
      ? sendViaResend(payload)
      : sendViaSes(payload));

    log.info('Email sent', {
      to: anonymizeEmail(job.to),
      template: job.template,
      provider: env.EMAIL_PROVIDER,
    });
  } catch (err) {
    log.error('Email send failed', {
      to: anonymizeEmail(job.to),
      template: job.template,
      provider: env.EMAIL_PROVIDER,
      error: err instanceof Error ? err.message : String(err),
    });

    throw err;
  }
}
