import {
  button,
  createEmailTemplate,
  heading,
  p,
} from '../email-template-builder';

export function buildRecoverPasswordEmail({
  name,
  resetPasswordUrl,
}: {
  name: string;
  resetPasswordUrl: string;
}): { subject: string; html: string } {
  const subject = 'Solicitação para redefinição de senha';
  const preheader =
    'Redefina sua senha de acesso ao Sistema Viver Melhor da ABNMO.';

  const html = createEmailTemplate({
    config: { title: subject, preheader },
    content: [
      heading('Redefinição de senha'),
      p(`Olá, ${name}!`),
      p(
        'Você solicitou a redefinição da sua senha de acesso ao <strong>Sistema Viver Melhor</strong> da <strong>ABNMO</strong>.',
      ),
      p(
        'Clique no botão abaixo para cadastrar sua nova senha:',
        'margin-bottom: 24px',
      ),
      button('Redefinir sua senha', resetPasswordUrl),
      p(
        '<em>Se você não realizou esta solicitação, favor ignorar este e-mail.</em>',
        'color: #666666; margin-top: 24px',
      ),
    ],
  });

  return { subject, html };
}
