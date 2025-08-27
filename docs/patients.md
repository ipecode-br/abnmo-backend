# Pacientes

Este documento descreve as rotas, regras de negócio e especificações técnicas referentes ao gerenciamento de pacientes no sistema.

## Estrutura de dados

### Campos do paciente

| Campo                   | Tipo    | Obrigatório | Descrição                                                                                          |
| ----------------------- | ------- | ----------- | -------------------------------------------------------------------------------------------------- |
| `user_id`               | UUID    | Condicional | ID do usuário associado (obrigatório se `name` e `email` não fornecidos)                           |
| `name`                  | string  | Condicional | Nome do usuário (obrigatório se `user_id` não fornecido)                                           |
| `email`                 | string  | Condicional | Email do usuário (obrigatório se `user_id` não fornecido)                                          |
| `gender`                | enum    | Sim         | Gênero (`male_cis`, `female_cis`, `male_trans`, `female_trans`, `non_binary`, `prefer_not_to_say`) |
| `date_of_birth`         | date    | Sim         | Data de nascimento                                                                                 |
| `phone`                 | string  | Sim         | Telefone (10-11 dígitos, apenas números)                                                           |
| `cpf`                   | string  | Sim         | CPF (11 dígitos, único no sistema)                                                                 |
| `state`                 | enum    | Sim         | Estado brasileiro (conforme constantes do sistema)                                                 |
| `city`                  | string  | Sim         | Cidade                                                                                             |
| `has_disability`        | boolean | Não         | Possui deficiência (padrão: false)                                                                 |
| `disability_desc`       | string  | Não         | Descrição da deficiência                                                                           |
| `need_legal_assistance` | boolean | Não         | Necessita assistência jurídica (padrão: false)                                                     |
| `take_medication`       | boolean | Não         | Toma medicação (padrão: false)                                                                     |
| `medication_desc`       | string  | Não         | Descrição da medicação                                                                             |
| `has_nmo_diagnosis`     | boolean | Não         | Possui diagnóstico de NMO (padrão: false)                                                          |
| `supports`              | array   | Não         | Array de contatos de apoio                                                                         |

### Campos de contato de apoio

| Campo     | Tipo   | Obrigatório | Descrição                             |
| --------- | ------ | ----------- | ------------------------------------- |
| `name`    | string | Sim         | Nome do contato (3-100 caracteres)    |
| `phone`   | string | Sim         | Telefone (11 dígitos, apenas números) |
| `kinship` | string | Sim         | Grau de parentesco                    |

### Status do paciente

- `active`: Paciente ativo no sistema
- `inactive`: Paciente inativo no sistema

## 1. Cadastrar paciente

Cria um novo paciente no sistema, associado a um usuário existente ou criando um novo usuário.

**Rota**: `POST /patients`

### Regras de negócio

- **Permissões**: usuários `manager` e `nurse`;
- Dois modos de operação:
  1. **Com `user_id` existente**: associa a um usuário já cadastrado (ignora os campos `email` e `name`)
  2. **Sem `user_id`**: cria novo usuário automaticamente (`email` e `name` são obrigatórios)
- O CPF deve ser único no sistema;
- Não é possível cadastrar um paciente para um usuário que já possui cadastro de paciente;
- O telefone deve conter apenas números e ter entre 10 e 11 dígitos;
- É possível cadastrar contatos de apoio junto com o paciente através do campo `supports`.

### Especificações técnicas

- Request Body: CreatePatientDto (`src/app/http/patients/patients.dtos.ts`)

### Fluxo

1. Executa validação dentro de transação de banco de dados;
2. Verifica se foi fornecido `user_id`:
   - **Caso não**: valida presença de `email` e `name`, verifica se o email já existe, gera senha aleatória e cria novo usuário;
   - **Caso sim**: busca usuário existente no banco de dados;
3. Verifica se o usuário encontrado/criado já possui cadastro de paciente;
4. Verifica se o CPF fornecido já está em uso por outro paciente;
5. Cria o registro do paciente no banco de dados;
6. Cadastra os contatos de apoio, se fornecidos;
7. Em caso de sucesso, registra um log da operação;
8. Retorna a resposta com o resultado da operação.

## 2. Listar pacientes

Retorna uma lista paginada de todos os pacientes cadastrados no sistema com filtros opcionais.

**Rota**: `GET /patients`

### Regras de negócio

- **Permissões**: usuários `manager` e `nurse`;
- Suporte a filtros opcionais para busca e ordenação;
- Paginação fixa de 10 itens por página.

### Especificações técnicas

- Request Query: FindAllPatientQueryDto (`src/app/http/patients/patients.dtos.ts`)
- Filtros disponíveis:
  - `search`: string para busca por nome ou email do usuário
  - `status`: filtro por status (`active` ou `inactive`)
  - `orderBy`: campo para ordenação (`name`, `status` ou `date`)
  - `order`: direção da ordenação (`ASC` ou `DESC`)
  - `page`: número da página
  - `startDate`: data inicial no formato ISO 8601
  - `endDate`: data final no formato ISO 8601 (deve ser posterior à `startDate`)

### Fluxo

1. Recebe e valida os parâmetros de filtro da query;
2. Constrói query no banco com os filtros aplicados;
3. Executa busca com JOIN para incluir dados do usuário;
4. Aplica paginação (10 itens por página);
5. Retorna a resposta com a lista de pacientes e total de registros.

## 3. Buscar paciente por ID

Retorna as informações detalhadas de um paciente específico.

**Rota**: `GET /patients/:id`

### Regras de negócio

- **Permissões**: usuários `manager`, `nurse` e `specialist`;
- O parâmetro `id` deve ser um UUID válido;
- Retorna dados do paciente incluindo informações do usuário e contatos de apoio.

### Especificações técnicas

- Request Params: `:id` (UUID do paciente)

### Fluxo

1. Recebe o ID do paciente nos parâmetros da requisição;
2. Busca o paciente no banco de dados incluindo dados do usuário e contatos de apoio;
3. Verifica se o paciente existe, caso contrário retorna erro 404;
4. Retorna a resposta com os dados completos do paciente.

## 4. Inativar paciente

Altera o status de um paciente para `inactive`, tornando-o inativo no sistema.

**Rota**: `PATCH /patients/:id/inactivate`

### Regras de negócio

- **Permissões**: usuários `manager` e `nurse`;
- O parâmetro `id` deve ser um UUID válido;
- Não é possível inativar um paciente que já está inativo.

### Especificações técnicas

- Request Params: `:id` (UUID do paciente)

### Fluxo

1. Busca o paciente no banco de dados pelo ID fornecido;
2. Verifica se o paciente existe, caso contrário retorna erro 404;
3. Verifica se o paciente já está inativo, caso sim retorna erro 409;
4. Atualiza o status do paciente para `inactive`;
5. Em caso de sucesso, registra um log da operação;
6. Retorna a resposta confirmando a inativação.

## 5. Listar contatos de apoio do paciente

Retorna todos os contatos de apoio vinculados a um paciente específico.

**Rota**: `GET /patients/:id/patient-supports`

### Regras de negócio

- **Permissões**: usuários `manager`, `nurse`, `specialist` e `patient`;
- Um usuário `patient` só pode visualizar os contatos de apoio vinculados ao seu próprio cadastro;
- O parâmetro `id` deve ser um UUID válido.

### Especificações técnicas

- Request Params: `:id` (UUID do paciente)

### Fluxo

1. Busca o paciente no banco de dados pelo ID fornecido;
2. Verifica se o paciente existe, caso contrário retorna erro 404;
3. Busca todos os contatos de apoio vinculados ao paciente;
4. Retorna a resposta com a lista de contatos de apoio e total de registros.

## 6. Remover paciente

Remove permanentemente um paciente e seus dados relacionados do sistema.

**Rota**: `DELETE /patients/:id`

### Regras de negócio

- **Permissões**: não especificadas no controller (endpoint público);
- O parâmetro `id` deve ser um UUID válido;
- A remoção é permanente e irreversível.

### Especificações técnicas

- Request Params: `:id` (UUID do paciente)

### Fluxo

1. Busca o paciente no banco de dados pelo ID fornecido;
2. Verifica se o paciente existe, caso contrário retorna erro 404;
3. Remove permanentemente o registro do paciente do banco de dados;
4. Em caso de sucesso, registra um log da operação;
5. Retorna a resposta confirmando a remoção.

## 7. Atualizar paciente

Atualiza os dados cadastrais de um paciente existente.

**Rota**: `PUT /patients/:id`

### Regras de negócio

- **Permissões**: não especificadas no controller (endpoint público);
- O parâmetro `id` deve ser um UUID válido;
- Se o CPF for alterado, deve ser verificado se não está em uso por outro paciente;
- Não é possível alterar o `user_id`, `status` ou dados de controle (`created_at`, `updated_at`).

### Especificações técnicas

- Request Params: `:id` (UUID do paciente)
- Request Body: UpdatePatientDto (`src/app/http/patients/patients.dtos.ts`)

### Fluxo

1. Busca o paciente no banco de dados pelo ID fornecido;
2. Verifica se o paciente existe, caso contrário retorna erro 404;
3. Se o CPF foi alterado, verifica se não está sendo usado por outro paciente;
4. Atualiza os dados do paciente no banco de dados;
5. Em caso de sucesso, registra um log da operação;
6. Retorna a resposta confirmando a atualização.

## 8. Obter status dos formulários dos pacientes

Método interno do service que analisa o status de preenchimento dos formulários de triagem dos pacientes.

**Método**: `getPatientFormsStatus()` (método interno do PatientsService)

### Regras de negócio

- Avalia cada paciente para determinar quais formulários estão pendentes ou completos;
- Atualmente valida apenas o formulário de triagem;
- Um formulário de triagem é considerado completo quando todos os campos obrigatórios estão preenchidos.

### Especificações técnicas

- Retorna: `PatientFormsStatus[]` com informações de formulários pendentes e completos por paciente

### Campos obrigatórios para formulário de triagem

| Campo do Sistema        | Campo de Validação | Descrição                |
| ----------------------- | ------------------ | ------------------------ |
| `gender`                | `desc_gender`      | Gênero do paciente       |
| `date_of_birth`         | `birth_of_date`    | Data de nascimento       |
| `city`                  | `city`             | Cidade                   |
| `state`                 | `state`            | Estado                   |
| `phone`                 | `whatsapp`         | Telefone/WhatsApp        |
| `cpf`                   | `cpf`              | CPF                      |
| `has_disability`        | `have_disability`  | Possui deficiência       |
| `need_legal_assistance` | `need_legal_help`  | Necessita ajuda jurídica |
| `take_medication`       | `use_medicine`     | Usa medicação            |

### Fluxo

1. Busca todos os pacientes com suas relações (usuário);
2. Para cada paciente, executa validação do formulário de triagem;
3. Identifica campos faltantes usando o validador `validateTriagemForm`;
4. Retorna array com status dos formulários por paciente, incluindo:
   - ID do paciente (usando o CPF como identificador)
   - Nome do paciente
   - Lista de formulários pendentes com campos faltantes
   - Lista de formulários completos

## Logs e auditoria

O sistema registra logs para as seguintes operações:

### Logs de sucesso

- **Cadastro de paciente**: registra ID do paciente, ID do usuário e email
- **Atualização de paciente**: registra ID do paciente, ID do usuário e email
- **Inativação de paciente**: registra ID do paciente e ID do usuário
- **Remoção de paciente**: registra ID do paciente e ID do usuário

### Logs de erro

- **CPF duplicado no cadastro**: registra ID do usuário, email e CPF
- **CPF duplicado na atualização**: registra ID do paciente, ID do usuário e email

## Métodos do repository

### Métodos públicos disponíveis

- `findAll(filters)`: Busca paginada com filtros
- `findById(id)`: Busca por ID com relações (user, supports)
- `findByUserId(userId)`: Busca por ID do usuário com relações
- `findByCpf(cpf)`: Busca por CPF
- `create(patient)`: Cria novo paciente
- `update(patient)`: Atualiza paciente existente
- `remove(patient)`: Remove paciente permanentemente
- `deactivate(id)`: Inativa paciente
- `getFormsStatus()`: Analisa status dos formulários (método legado)
- `getPatientsWithRelations()`: Busca todos com relações
- `getPatientsTotal()`: Estatísticas totais de pacientes
- `getPatientsStatisticsByPeriod()`: Estatísticas por período

## Códigos de resposta HTTP

### Respostas de sucesso

- **200 OK**: Operação realizada com sucesso (GET, PUT, PATCH, DELETE)
- **201 Created**: Recurso criado com sucesso (POST)

### Respostas de erro

- **400 Bad Request**: Dados de entrada inválidos ou regra de negócio violada
- **401 Unauthorized**: Token de autenticação ausente ou inválido
- **403 Forbidden**: Usuário não possui permissões necessárias para a operação
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito de dados (CPF duplicado, email já em uso, paciente já inativo, etc.)
- **422 Unprocessable Entity**: Dados de entrada não passaram na validação do schema
- **500 Internal Server Error**: Erro interno do servidor

## Validações e restrições

### Validações de entrada

- **CPF**: Deve ter 11 dígitos e ser único no sistema
- **Telefone**: Deve conter apenas números e ter entre 10-11 dígitos
- **Email**: Deve ser um email válido (quando criando novo usuário)
- **UUID**: Parâmetros de ID devem ser UUIDs válidos
- **Datas**: `startDate` deve ser anterior a `endDate` nos filtros
- **Estados**: Devem corresponder aos estados brasileiros válidos do sistema

### Restrições de negócio

- Um usuário pode ter apenas um cadastro de paciente
- CPF deve ser único em todo o sistema
- Não é possível inativar um paciente já inativo
- Pacientes só podem visualizar/alterar dados vinculados ao seu próprio cadastro (quando aplicável)
- Campos condicionais: `name` e `email` são obrigatórios quando `user_id` não é fornecido
