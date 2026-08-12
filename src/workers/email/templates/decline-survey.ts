import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '../config';
import { BuildEmailTemplateOutput } from '../types';
import {
  createEmailTemplate,
  heading,
  p,
} from '../utils/email-template-builder';

const NON_NUMBER_REGEX = /\D/g;

interface BuildDeclineSurveyEmailInput {
  name: string;
  reason: string;
}

export function buildDeclineSurveyEmail({
  name,
  reason,
}: BuildDeclineSurveyEmailInput): BuildEmailTemplateOutput {
  const subject = 'Sua catalogação foi recusada — ABNMO';
  const preheader =
    'Sua submissão foi recusada. Confira mais informações sobre o motivo e como proceder.';

  const formatedPhone = SUPPORT_WHATSAPP.replace(NON_NUMBER_REGEX, '');
  const whatsAppUrl = `https://wa.me/55${formatedPhone}`;

  const html = createEmailTemplate({
    config: { title: subject, preheader },
    content: [
      heading('Pesquisa Nacional da Neuromielite Óptica'),
      p(`Olá, ${name}!`),
      p(
        'Sua submissão de catalogação foi <strong>recusada</strong> pelo seguinte motivo:',
      ),
      p(
        reason,
        'background-color: #f8f8f8; border-radius: 12px; padding: 20px 24px;',
      ),
      p(
        'Para esclarecer dúvidas ou solicitar orientações sobre como prosseguir, entre em contato conosco através do WhatsApp ou e-mail abaixo:',
      ),
      p(
        `- Whatsapp: <strong>${SUPPORT_WHATSAPP}</strong> ou <a href=${whatsAppUrl} style='text-decoration: underline;' target='_blank' rel='noopener noreferrer'>clique aqui</a>`,
        'margin: 6px 0',
      ),
      p(`- E-mail: <strong>${SUPPORT_EMAIL}</strong></a>`, 'margin: 6px 0'),
    ],
  });

  return { subject, html };
}
