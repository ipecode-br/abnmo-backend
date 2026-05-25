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
        'Você foi convidado a participar do <strong>Sistema Viver Melhor</strong> da <strong>ABNMO</strong>. Para ter acesso, realize a criação da sua conta.',
      ),
      p('Clique no botão para realizar o cadastro.', 'margin-bottom: 24px'),
      button('Cadastrar conta', registerUserUrl),
    ],
  });
}
