import { Resend } from 'resend';

import { FROM_EMAIL } from '../config';
import { env } from '../env';
import { SendEmailPayload } from '../types';

const resend = new Resend(env.RESEND_KEY);

export async function sendViaResend({
  to,
  subject,
  html,
}: SendEmailPayload): Promise<void> {
  await resend.emails.send({ from: FROM_EMAIL, to, subject, html });
}
