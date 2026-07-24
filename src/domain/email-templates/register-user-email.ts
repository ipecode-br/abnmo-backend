import {
  button,
  createEmailTemplate,
  heading,
  p,
} from '@/utils/email-template-builder';

interface BuildRegisterUserEmailProps {
  title: string;
  preheader: string;
  registerUserUrl: string;
}

export function buildRegisterUserEmail({
  preheader,
  title,
  registerUserUrl,
}: BuildRegisterUserEmailProps) {
  return createEmailTemplate({
    config: { title, preheader },
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
}
