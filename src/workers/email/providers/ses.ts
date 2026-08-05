import { SendEmailCommand, SESClient } from '@aws-sdk/client-ses';

import { FROM_EMAIL } from '../config';
import { SendEmailPayload } from '../types';

const ses = new SESClient({});

export async function sendViaSes({
  to,
  subject,
  html,
}: SendEmailPayload): Promise<void> {
  await ses.send(
    new SendEmailCommand({
      Source: FROM_EMAIL,
      Destination: { ToAddresses: [to] },
      Message: {
        Subject: { Data: subject, Charset: 'UTF-8' },
        Body: { Html: { Data: html, Charset: 'UTF-8' } },
      },
    }),
  );
}
