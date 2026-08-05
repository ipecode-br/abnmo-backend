import {
  button,
  createEmailTemplate,
  heading,
  p,
} from '../email-template-builder';

export function buildRegisterUserEmail({
  registerUserUrl,
}: {
  registerUserUrl: string;
}): { subject: string; html: string } {
  const subject = 'Cadastre sua conta no Sistema Viver Melhor da ABNMO';
  const preheader =
    'Conclua o cadastro da sua conta para acessar o Sistema Viver Melhor da ABNMO.';

  const html = createEmailTemplate({
    config: { title: subject, preheader },
    content: [
      heading('Cadastre sua conta'),
      p(`Olá!`),
      p(
        'Você foi convidado a participar do <strong>Sistema Viver Melhor</strong> da <strong>ABNMO</strong>.',
      ),
      p(
        'Para acessar o sistema, você precisa concluir a criação da sua conta.',
      ),
      p(
        'Clique no botão abaixo para concluir o cadastro:',
        'margin-bottom: 24px',
      ),
      button('Cadastrar conta', registerUserUrl),
    ],
  });

  return { subject, html };
}
