import {
  createEmailTemplate,
  heading,
  p,
} from '@/utils/email-template-builder';

interface BuildResetPasswordEmailProps {
  title: string;
  preheader: string;
  name: string;
}

export function buildResetPasswordEmail({
  name,
  preheader,
  title,
}: BuildResetPasswordEmailProps) {
  return createEmailTemplate({
    config: { title, preheader },
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
}
