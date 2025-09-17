# Autenticação

Este documento descreve as rotas, regras de negócio e especificações técnicas referentes ao sistema de autenticação.

## Estrutura de dados

### Campos de login

| Campo        | Tipo    | Obrigatório | Descrição                                          |
| ------------ | ------- | ----------- | -------------------------------------------------- |
| `email`      | string  | Sim         | Email do usuário                                   |
| `password`   | string  | Sim         | Senha do usuário (mínimo 8 caracteres)             |
| `rememberMe` | boolean | Não         | Manter sessão ativa por mais tempo (padrão: false) |

### Campos de registro

| Campo      | Tipo   | Obrigatório | Descrição                           |
| ---------- | ------ | ----------- | ----------------------------------- |
| `name`     | string | Sim         | Nome do usuário                     |
| `email`    | string | Sim         | Email do usuário (único no sistema) |
| `password` | string | Sim         | Senha com critérios de segurança    |

### Campos de recuperação de senha

| Campo   | Tipo   | Obrigatório | Descrição                         |
| ------- | ------ | ----------- | --------------------------------- |
| `email` | string | Sim         | Email do usuário para recuperação |

### Campos de redefinição de senha

| Campo      | Tipo   | Obrigatório | Descrição                             |
| ---------- | ------ | ----------- | ------------------------------------- |
| `password` | string | Sim         | Nova senha com critérios de segurança |

## 1. Login do usuário

Autentica um usuário com e-mail e senha.

**Rota**: `POST /login`

### Regras de negócio

- **Permissões**: endpoint público;
- O usuário deve fornecer e-mail e senha válidos;
- A senha deve ter no mínimo 8 caracteres;
- O sistema verifica se as credenciais correspondem a um usuário existente;
- O usuário pode optar por manter a sessão ativa por mais tempo (`rememberMe`);
- Um token JWT é gerado e armazenado como cookie (`access_token`).

### Especificações técnicas

- Request Body: SignInWithEmailDto (`src/app/http/auth/auth.dtos.ts`)

### Fluxo

1. Validação do schema de entrada;
2. Busca do usuário por e-mail;
3. Comparação de hash da senha;
4. Geração do token JWT com expiração baseada em `rememberMe`;
5. Armazenamento do token no banco de dados;
6. Configuração do cookie HTTP-only.

## 2. Registro do usuário

Cria uma nova conta de usuário.

**Rota**: `POST /register`

### Regras de negócio

- **Permissões**: endpoint público;
- Todos os campos obrigatórios devem ser fornecidos;
- O e-mail deve ser único no sistema;
- A senha deve ter no mínimo 8 caracteres, contendo letras maiúscula e minúscula, número e caractere especial;
- O usuário será registrado com a _role_ `patient` por padrão;
- Após registro, o usuário é automaticamente autenticado.

### Especificações técnicas

- Request Body: CreateUserDto (`src/app/http/users/users.dtos.ts`)

### Fluxo

1. Validação do _schema_ de entrada;
2. Verificação de e-mail único;
3. Hash da senha;
4. Criação do usuário no banco de dados;
5. Autenticação automática (gera token JWT);
6. Configuração do cookie HTTP-only (`access_token`).

## 3. Logout do usuário

Encerra a sessão do usuário.

**Rota**: `POST /logout`

### Regras de negócio

- **Permissões**: endpoint público;
- Requer um token de acesso válido;
- Remove o token do banco de dados;
- Limpa o cookie de acesso.

### Especificações técnicas

- Request Cookies: `access_token` (Token JWT válido)

## 4. Recuperação de senha

Inicia o processo de recuperação de senha do usuário.

**Rota**: `POST /recover-password`

### Regras de negócio

- **Permissões**: endpoint público;
- O usuário deve fornecer um e-mail válido;
- Gera um token de recuperação de senha com validade de 4 horas;
- O token é armazenado como cookie (`password_reset`);
- Um e-mail com link de recuperação é enviado ao usuário.

### Especificações técnicas

- Request Body: RecoverPasswordDto (`src/app/http/auth/auth.dtos.ts`)

### Fluxo

1. Validação do schema de entrada;
2. Busca do usuário pelo e-mail;
3. Geração do token de recuperação de senha;
4. Configuração do cookie de recuperação (`password_reset`) com validade de 4 horas;
5. Envio do e-mail com link de recuperação.

## 5. Redefinição de senha

Conclui o processo de redefinição de senha do usuário.

**Rota**: `POST /reset-password`

### Regras de negócio

- **Permissões**: endpoint público;
- Requer um token de redefinição de senha válido;
- A nova senha deve atender aos critérios de segurança;
- Remove o token de recuperação após uso bem-sucedido;
- Autentica o usuário automaticamente após a redefinição.

### Especificações técnicas

- Request Body: ResetPasswordDto (`src/app/http/auth/auth.dtos.ts`)
- Request Cookies: `password_reset` (Token de redefinição válido)

### Fluxo

1. Verificação da presença do token de recuperação;
2. Validação do token de redefinição;
3. Hash da nova senha;
4. Atualização da senha no banco de dados;
5. Remoção do token de recuperação;
6. Geração de novo token de acesso;
7. Configuração do cookie de acesso (`access_token`).

## Logs e auditoria

O sistema registra logs para as seguintes operações:

### Logs de sucesso

- **Login bem-sucedido**: registra ID do usuário e email
- **Registro de usuário**: registra ID do usuário e email
- **Recuperação de senha solicitada**: registra ID do usuário e email
- **Redefinição de senha**: registra ID do usuário e email
- **Logout**: registra ID do usuário e email

### Logs de erro

- **Tentativa de login com credenciais inválidas**: registra email utilizado
- **Tentativa de registro com email duplicado**: registra email utilizado
- **Tentativa de recuperação com email inexistente**: registra email utilizado

## Métodos do repository

### Métodos relacionados à autenticação

- `findByEmail(email)`: Busca usuário por email
- `create(user)`: Cria novo usuário
- `updatePassword(userId, hashedPassword)`: Atualiza senha do usuário
- `createToken(userId, token)`: Armazena token no banco
- `validateToken(token)`: Valida token existente
- `removeToken(token)`: Remove token do banco

## Códigos de resposta HTTP

### Respostas de sucesso

- **200 OK**: Operação realizada com sucesso (POST login, logout, recuperação, redefinição)
- **201 Created**: Usuário criado com sucesso (POST register)

### Respostas de erro

- **400 Bad Request**: Dados de entrada inválidos ou regra de negócio violada
- **401 Unauthorized**: Credenciais inválidas ou token expirado/inválido
- **404 Not Found**: Email não encontrado (recuperação de senha)
- **409 Conflict**: Email já existe no sistema (registro)
- **422 Unprocessable Entity**: Dados de entrada não passaram na validação do schema
- **500 Internal Server Error**: Erro interno do servidor

## Validações e restrições

### Validações de entrada

- **Email**: Deve ser um email válido e único no sistema
- **Senha**: Deve ter no mínimo 8 caracteres, contendo letras maiúscula e minúscula, número e caractere especial
- **Nome**: Obrigatório para registro, deve ter entre 3-100 caracteres

### Restrições de negócio

- Um email pode ter apenas uma conta associada
- Tokens de recuperação têm validade de 4 horas
- Tokens de acesso têm validade de 12 horas (padrão) ou 30 dias (com `rememberMe`)
- Senhas são armazenadas apenas como hash criptográfico
- Após registro bem-sucedido, usuário é automaticamente autenticado

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
- Mínimo 8 caracteres com critérios de complexidade.

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
