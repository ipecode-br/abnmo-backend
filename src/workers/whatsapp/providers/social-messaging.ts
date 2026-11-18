import {
  SendWhatsAppMessageCommand,
  SendWhatsAppMessageCommandOutput,
  SocialMessagingClient,
} from '@aws-sdk/client-socialmessaging';

import { debugLog, describeError } from '@/utils/debug-log';

import { env } from '../env';
import { SendWhatsAppPayload } from '../types';

const socialMessaging = new SocialMessagingClient({});

export async function sendViaSocialMessaging({
  message,
}: SendWhatsAppPayload): Promise<SendWhatsAppMessageCommandOutput> {
  const decodedMessage = new TextDecoder().decode(message);

  debugLog('social-messaging request', {
    originationPhoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
    metaApiVersion: env.WHATSAPP_META_API_VERSION,
    region: process.env.AWS_REGION ?? 'unset',
    messageBytes: message.byteLength,
    message: decodedMessage,
  });

  try {
    const response = await socialMessaging.send(
      new SendWhatsAppMessageCommand({
        originationPhoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID,
        metaApiVersion: env.WHATSAPP_META_API_VERSION,
        message,
      }),
    );

    debugLog('social-messaging response', {
      messageId: response.messageId,
      httpStatusCode: response.$metadata?.httpStatusCode,
      requestId: response.$metadata?.requestId,
    });

    return response;
  } catch (err) {
    debugLog('social-messaging error', describeError(err));

    throw err;
  }
}
