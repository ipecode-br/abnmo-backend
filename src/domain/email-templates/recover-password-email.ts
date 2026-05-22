import {
  button,
  createEmailTemplate,
  heading,
  p,
} from '@/utils/email-template-builder';

interface BuildRecoverPasswordEmailProps {
  title: string;
  preheader: string;
  name: string;
  resetPasswordUrl: string;
}

export function buildRecoverPasswordEmail({
  name,
  preheader,
  title,
  resetPasswordUrl,
}: BuildRecoverPasswordEmailProps) {
  return createEmailTemplate({
    config: { title, preheader },
    content: [
      heading('Redefinição de senha'),
      p(`Olá, ${name}!`),
      p(
        'Você solicitou a redefinição da sua senha de acesso ao <strong>Sistema Viver Melhor</strong> da <strong>ABNMO</strong>.',
      ),
      p(
        'Clique no botão para cadastrar sua nova senha.',
        'margin-bottom: 24px',
      ),
      button('Redefinir sua senha', resetPasswordUrl),
      p(
        '<em>Se você não realizou esta solicitação, favor ignorar este e-mail.</em>',
        'color: #666666; margin-top: 24px',
      ),
    ],
  });
}
