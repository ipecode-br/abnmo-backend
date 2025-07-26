# Autenticação

Este documento descreve as regras de negócio e especificações técnicas para o sistema de autenticação, incluindo login, registro e logout de usuários.

## Endpoints

### 1. Login do usuário

Autentica um usuário com e-mail e senha.

**Rota**: `POST /login`

#### Regras de negócio

- O usuário deve fornecer e-mail e senha válidos;
- A senha deve ter no mínimo 8 caracteres;
- O sistema verifica se as credenciais correspondem a um usuário existente;
- O usuário pode optar por manter a sessão ativa por mais tempo (`rememberMe`);
- Um token JWT é gerado e armazenado como cookie (`access_token`).

#### Especificações técnicas

- Request Body: SignInWithEmailDto (`src/app/http/auth/auth.dtos.ts`).

#### Fluxo:

1. Validação do schema de entrada;
2. Busca do usuário por e-mail;
3. Comparação de hash da senha;
4. Geração do token JWT com expiração baseada em `rememberMe`;
5. Armazenamento do token no banco de dados;
6. Configuração do cookie HTTP-only.

### 2. Registro do usuário

Cria uma nova conta de usuário.

**Rota**: `POST /register`

#### Regras de negócio

- Todos os campos obrigatórios devem ser fornecidos;
- O e-mail deve ser único no sistema;
- A senha deve ter no mínimo 8 caracteres, contendo letras maiúscula e minúscula, número e caractere especial;
- Após registro, o usuário é automaticamente autenticado.

#### Especificações técnicas

- Request Body: CreateUserDto (`src/app/http/users/users.dtos.ts`).

#### Fluxo

1. Validação do _schema_ de entrada;
2. Verificação de e-mail único;
3. Hash da senha;
4. Criação do usuário no banco de dados;
5. Autenticação automática (gera token JWT);
6. Configuração do cookie HTTP-only (`access_token`).

### 3. Logout do usuário

 Encerra a sessão do usuário.

**Rota**: `POST /logout`

#### Regras de negócio

- Requer um token de acesso válido;
- Remove o token do banco de dados;
- Limpa o cookie de acesso.

#### Especificações técnicas

- Request Cookies: `access_token` (Token JWT válido).

#### Fluxo

1. Verificação da presença do token;
2. Remoção do token do banco de dados;
3. Remoção do cookie.

## Segurança

### Cookies

- **HTTP-only**: Impede acesso via JavaScript;
- **Secure**: Deve ser usado em produção com HTTPS;
- **SameSite**: Protege contra CSRF.

### Tokens

- JWT assinado;
- Armazenado no banco de dados para permitir revogação;
- Expiração baseada em configuração (12h padrão ou 30d para `rememberMe`).

### Senhas

- Armazenadas como hash (**nunca** em texto plano);
- Mínimo 8 caracteres.

## Considerações importantes

- **Roles**: o sistema possui 5 tipos de usuários com diferentes níveis de acesso;
- **Remember me**: quando ativado, o token tem validade de 30 dias;
- **Cookies**:
  - O acesso ao sistema depende do cookie `access_token`;
  - Os cookies são gerados e gerenciados pelo backend do sistema.
- **Tratamento de erros**:
  - Dados inválidos retornam 400;
  - Credenciais inválidas retornam 401;
  - Conflitos (e-mail duplicado) retornam 409;
- **Banco de dados**:
  - Tokens são persistidos para permitir revogação;
  - Operações são transacionais para garantir consistência.