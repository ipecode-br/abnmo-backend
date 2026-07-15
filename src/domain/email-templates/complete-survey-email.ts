import {
  button,
  createEmailTemplate,
  heading,
  p,
} from '@/utils/email-template-builder';

interface BuildCompleteSurveyEmailProps {
  title: string;
  preheader: string;
  completeSurveyUrl: string;
}

export function buildCompleteSurveyEmail({
  completeSurveyUrl,
  preheader,
  title,
}: BuildCompleteSurveyEmailProps) {
  return createEmailTemplate({
    config: { title, preheader },
    content: [
      heading('Catalogação ABNMO'),
      p(
        'Sua submissão de catalogação foi <strong>aprovada</strong> pela equipe da <strong>ABNMO</strong>.',
      ),
      p(
        'Agora você pode preencher o questionário completo da catalogação para nos ajudar a entender melhor o seu perfil e necessidades.',
        'margin-bottom: 24px',
      ),
      button('Preencher catalogação', completeSurveyUrl),
      p(
        '<em>Se você não reconhece esta solicitação, favor ignorar este e-mail.</em>',
        'color: #666666; margin-top: 24px',
      ),
    ],
  });
}
