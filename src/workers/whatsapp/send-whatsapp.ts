import { SendWhatsAppJob } from '@/shared/queue/schemas/whatsapp';

import { logger } from './logger';
import { sendViaSocialMessaging } from './providers/social-messaging';
import { buildCompleteSurveyTemplate } from './templates/complete-survey';
import { buildDeclineSurveyTemplate } from './templates/decline-survey';
import { WhatsAppTemplateMessage } from './types';

export async function sendWhatsApp(job: SendWhatsAppJob): Promise<void> {
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

  try {
    await sendViaSocialMessaging({
      message: new TextEncoder().encode(JSON.stringify(payload)),
    });

    logger.info('WhatsApp message sent', {
      phone: job.to,
      template: job.template,
    });
  } catch (err) {
    logger.error('WhatsApp message send failed', {
      phone: job.to,
      template: job.template,
      error: err instanceof Error ? err.message : String(err),
    });

    throw err;
  }
}
