import { Resend } from 'resend';

import { FROM_EMAIL } from './config';

const resendKey = process.env.RESEND_KEY ?? '';
const resend = new Resend(resendKey);

export async function sendViaResend({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  await resend.emails.send({
    from: FROM_EMAIL,
    to,
    subject,
    html,
  });
}
