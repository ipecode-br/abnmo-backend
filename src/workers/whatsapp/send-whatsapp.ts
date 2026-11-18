import { SendWhatsAppJob } from '@/shared/queue/schemas/whatsapp';
import { anonymizePhoneE164 } from '@/utils/anonymize';
import { debugLog, describeError } from '@/utils/debug-log';

import { logger } from './logger';
import { sendViaSocialMessaging } from './providers/social-messaging';
import { buildCompleteSurveyTemplate } from './templates/complete-survey';
import { buildDeclineSurveyTemplate } from './templates/decline-survey';
import { WhatsAppTemplateMessage } from './types';

export async function sendWhatsApp(job: SendWhatsAppJob): Promise<void> {
  debugLog('sendWhatsApp started', {
    template: job.template,
    phone: anonymizePhoneE164(job.to),
    job,
  });

  let template: WhatsAppTemplateMessage;

  switch (job.template) {
    case 'completeSurvey':
      template = buildCompleteSurveyTemplate(job);
      break;
    case 'declineSurvey':
      template = buildDeclineSurveyTemplate(job);
      break;
    default: {
      const _exhaustive: never = job;
      throw new Error(
        `Unhandled WhatsApp template: ${(_exhaustive as unknown as { template: string }).template}`,
      );
    }
  }

  const payload = {
    messaging_product: 'whatsapp',
    to: job.to,
    type: 'template',
    template: {
      name: template.name,
      language: { code: template.language },
      components: template.components,
    },
  };

  const serializedPayload = JSON.stringify(payload);

  debugLog('sendWhatsApp payload ready', {
    phone: anonymizePhoneE164(job.to),
    template: job.template,
    templateName: template.name,
    language: template.language,
    componentCount: template.components.length,
    payload: serializedPayload,
  });

  try {
    debugLog('sendWhatsApp calling provider', {
      phone: anonymizePhoneE164(job.to),
      payloadBytes: new TextEncoder().encode(serializedPayload).byteLength,
    });

    const response = await sendViaSocialMessaging({
      message: new TextEncoder().encode(serializedPayload),
    });

    debugLog('sendWhatsApp provider responded', {
      phone: anonymizePhoneE164(job.to),
      template: job.template,
      messageId: response.messageId,
      httpStatusCode: response.$metadata?.httpStatusCode,
      requestId: response.$metadata?.requestId,
    });

    logger.info('WhatsApp message sent', {
      phone: anonymizePhoneE164(job.to),
      template: job.template,
    });
  } catch (err) {
    debugLog('sendWhatsApp provider threw', {
      phone: anonymizePhoneE164(job.to),
      template: job.template,
      ...describeError(err),
    });

    logger.error('WhatsApp message send failed', {
      phone: anonymizePhoneE164(job.to),
      template: job.template,
      error: err instanceof Error ? err.message : String(err),
    });

    throw err;
  }
}
