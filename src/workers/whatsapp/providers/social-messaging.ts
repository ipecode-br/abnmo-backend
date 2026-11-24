import {
  SendWhatsAppMessageCommand,
  SocialMessagingClient,
} from '@aws-sdk/client-socialmessaging';

import { env } from '../env';
import { SendWhatsAppPayload } from '../types';

const socialMessaging = new SocialMessagingClient({});

export async function sendViaSocialMessaging({
  message,
}: SendWhatsAppPayload): Promise<void> {
  await socialMessaging.send(
    new SendWhatsAppMessageCommand({
      originationPhoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
      metaApiVersion: env.WHATSAPP_META_API_VERSION,
      message,
    }),
  );
}
