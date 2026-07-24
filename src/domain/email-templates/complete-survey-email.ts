import {
  button,
  createEmailTemplate,
  heading,
  p,
} from '@/utils/email-template-builder';

interface BuildCompleteSurveyEmailProps {
  title: string;
  preheader: string;
  name: string;
  completeSurveyUrl: string;
}

export function buildCompleteSurveyEmail({
  title,
  preheader,
  name,
  completeSurveyUrl,
}: BuildCompleteSurveyEmailProps) {
  return createEmailTemplate({
    config: { title, preheader },
    content: [
      heading('Pesquisa Nacional da Neuromielite Óptica'),
      p(`Olá, ${name}!`),
      p(
        'Sua submissão para a catalogação foi <strong>aprovada</strong> pela nossa equipe.',
      ),
      p(
        'Agora você pode preencher o questionário completo da pesquisa para nos ajudar a entender melhor o seu perfil e necessidades.',
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
