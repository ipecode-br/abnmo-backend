import { SUPPORT_EMAIL, SUPPORT_WHATSAPP } from '@/config';
import { NON_NUMBER_REGEX } from '@/constants/regex';
import {
  createEmailTemplate,
  heading,
  p,
} from '@/utils/email-template-builder';

interface BuildDeclineSurveyEmailProps {
  title: string;
  preheader: string;
  name: string;
  reason: string;
}

export function buildDeclineSurveyEmail({
  title,
  preheader,
  name,
  reason,
}: BuildDeclineSurveyEmailProps) {
  const formatedPhone = SUPPORT_WHATSAPP.replace(NON_NUMBER_REGEX, '');
  const whatsAppUrl = `https://wa.me/55${formatedPhone}`;

  return createEmailTemplate({
    config: { title, preheader },
    content: [
      heading('Pesquisa Nacional da Neuromielite Óptica'),
      p(`Olá, ${name}!`),
      p(
        'Sua submissão de catalogação foi <strong>recusada</strong> pelo seguinte motivo:',
      ),
      p(
        reason,
        'background-color: #f8f8f8; border-radius: 12px; padding: 12px 18px;',
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
}
