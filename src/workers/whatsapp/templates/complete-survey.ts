import { WhatsAppTemplateMessage } from '../types';

interface BuildSurveyApprovedTemplateInput {
  name: string;
  token: string;
}

export function buildCompleteSurveyTemplate({
  name,
  token,
}: BuildSurveyApprovedTemplateInput): WhatsAppTemplateMessage {
  return {
    name: 'survey_approved',
    language: 'pt_BR',
    components: [
      {
        type: 'body',
        parameters: [{ type: 'text', text: name }],
      },
      {
        type: 'button',
        sub_type: 'url',
        index: '0',
        parameters: [{ type: 'text', text: token }],
      },
    ],
  };
}
