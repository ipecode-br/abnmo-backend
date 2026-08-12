import { BuildEmailTemplateOutput } from '../types';
import {
  createEmailTemplate,
  heading,
  p,
} from '../utils/email-template-builder';

interface BuildResetPasswordEmailInput {
  name: string;
}

export function buildResetPasswordEmail({
  name,
}: BuildResetPasswordEmailInput): BuildEmailTemplateOutput {
  const subject = 'Senha de acesso alterada com sucesso';
  const preheader =
    'Sua senha de acesso ao Sistema Viver Melhor foi alterada com sucesso.';

  const html = createEmailTemplate({
    config: { title: subject, preheader },
    content: [
      heading('Sua senha de acesso foi alterada'),
      p(`Olá, ${name}!`),
      p(
        'A senha de acesso à sua conta no <strong>Sistema Viver Melhor</strong> foi alterada com sucesso.',
      ),
      p(
        '<em>Se você não solicitou esta alteração. Por favor, entre em contato conosco urgentemente.</em>',
      ),
    ],
  });

  return { subject, html };
}
