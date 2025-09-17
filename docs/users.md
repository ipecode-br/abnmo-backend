# Usuários

Este documento descreve as rotas, regras de negócio e especificações técnicas referentes ao gerenciamento de usuários no sistema.

## Estrutura de dados

### Campos do usuário

| Campo        | Tipo   | Obrigatório | Descrição                                   |
| ------------ | ------ | ----------- | ------------------------------------------- |
| `id`         | UUID   | -           | Identificador único do usuário              |
| `name`       | string | Sim         | Nome completo do usuário (3-100 caracteres) |
| `email`      | string | Sim         | E-mail único do usuário                     |
| `password`   | string | Sim         | Senha do usuário (mínimo 8 caracteres)      |
| `role`       | enum   | Sim         | Função do usuário (padrão: `patient`)       |
| `avatar_url` | string | Não         | URL do avatar do usuário                    |
| `created_at` | date   | -           | Data de criação do registro                 |
| `updated_at` | date   | -           | Data da última atualização                  |

### Roles disponíveis

| Role         | Descrição                                       |
| ------------ | ----------------------------------------------- |
| `admin`      | Administrador com acesso total ao sistema       |
| `manager`    | Gerente com permissões administrativas          |
| `nurse`      | Enfermeiro com permissões de cuidado            |
| `specialist` | Especialista médico                             |
| `patient`    | Paciente com acesso limitado aos próprios dados |

## 1. Buscar perfil do usuário

Retorna as informações do perfil do usuário autenticado.

**Rota**: `GET /users/profile`

### Regras de negócio

- **Permissões**: usuários `manager`, `nurse`, `specialist` e `patient`;
- Retorna apenas os dados do próprio usuário autenticado;
- Não expõe informações sensíveis como senha.

### Especificações técnicas

- Não requer parâmetros adicionais (usa dados do token JWT)

### Fluxo

1. Extrai informações do usuário através do token JWT;
2. Busca dados completos do usuário no banco de dados;
3. Retorna informações do perfil (exceto senha);
4. Retorna a resposta com os dados do usuário.

## Logs e auditoria

O sistema registra logs para as seguintes operações:

### Logs de sucesso

- **Consulta de perfil**: registra ID do usuário e timestamp

### Logs de erro

- **Tentativa de acesso com token inválido**: registra tentativa de acesso
- **Usuário não encontrado**: registra ID do token utilizado

## Métodos do repository

### Métodos públicos disponíveis

- `findById(id)`: Busca usuário por ID
- `findByEmail(email)`: Busca usuário por email
- `create(user)`: Cria novo usuário
- `update(user)`: Atualiza usuário existente
- `findProfile(id)`: Busca dados de perfil (sem senha)

## Códigos de resposta HTTP

### Respostas de sucesso

- **200 OK**: Perfil retornado com sucesso

### Respostas de erro

- **401 Unauthorized**: Token de autenticação ausente ou inválido
- **403 Forbidden**: Usuário não possui permissões necessárias
- **404 Not Found**: Usuário não encontrado
- **422 Unprocessable Entity**: Dados de entrada não passaram na validação do schema
- **500 Internal Server Error**: Erro interno do servidor

## Validações e restrições

### Validações de entrada

- **E-mail**: Deve ser um e-mail válido e único no sistema
- **Senha**: Mínimo 8 caracteres com critérios de complexidade (apenas na criação)
- **Nome**: Deve ter entre 3-100 caracteres
- **Role**: Deve ser uma das roles válidas do sistema

### Restrições de negócio

- E-mail deve ser único em todo o sistema
- Roles definem diferentes níveis de acesso aos endpoints
- Usuários só podem visualizar seus próprios dados de perfil
- Senhas nunca são retornadas nas consultas de perfil
- Apenas administradores podem alterar roles de outros usuários
