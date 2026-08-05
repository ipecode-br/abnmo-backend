import { SendEmailJob } from '@/shared/queue/email.dto';

import { sendViaResend } from './send-via-resend';
import { sendViaSes } from './send-via-ses';
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

  const provider = process.env.EMAIL_PROVIDER ?? 'ses';
  const payload = { to: job.to, ...rendered };

  if (provider === 'resend') return sendViaResend(payload);

  return sendViaSes(payload);
}
