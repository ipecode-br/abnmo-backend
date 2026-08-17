import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/config';

import { WhatsAppTemplateMessage } from '../types';

interface BuildDeclineSurveyTemplateInput {
  name: string;
  reason: string;
}

export function buildDeclineSurveyTemplate({
  name,
  reason,
}: BuildDeclineSurveyTemplateInput): WhatsAppTemplateMessage {
  return {
    name: 'survey_declined',
    language: 'pt_BR',
    components: [
      {
        type: 'body',
        parameters: [
          { type: 'text', text: name },
          { type: 'text', text: reason },
          { type: 'text', text: SUPPORT_WHATSAPP },
          { type: 'text', text: SUPPORT_EMAIL },
        ],
      },
    ],
  };
}
