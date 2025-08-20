# Entidade Paciente

Este documento descreve as regras de negócio e especificações técnicas para o endpoint do paciente, incluindo todas as suas rotas CRUD.

## Endpoints

### 1. Registro do Paciente

Cria o paciente relacionado com a conta criada do usuário.

**Rota:** `POST /patients`

#### Regras de negócio

- **Permissões necessárias**: `gerente`, `enfermeira`
- O usuário deve fornecer:
  - O `id` do usuário **OU**
  - `nome` e `e-mail` do usuário (para criação de nova conta)
- Todos os campos obrigatórios devem ser fornecidos
- O sistema verifica se o paciente já existe com as credenciais do usuário
- O campo `telefone` deve conter:
  - Apenas números
  - Entre 10 e 11 dígitos

#### Especificações técnicas:

- **Request Body**: CreatePatientDto (`src/app/http/patients.dto.ts`)
- **Responses**:
  - 201 Created: Paciente criado com sucesso
  - 400 Bad Request: Dados inválidos
  - 403 Forbidden: Permissão insuficiente
  - 409 Conflict: CPF ou email já cadastrado

#### Fluxo:

1. Validação do schema de entrada
2. Verificação do campo `id` do usuário:
   - Se não fornecido, verifica campos `e-mail` e `nome`
   - Gera senha aleatória
   - Cria novo usuário
3. Verificação da existência do usuário no banco de dados
4. Criação do paciente

### 2. Busca de todos os pacientes

Exibe todos os pacientes cadastrados no sistema.

**Rota:** `GET /patients`

#### Regras de negócio

- **Permissões necessárias**: `gerente`, `enfermeira`
- **Filtros opcionais**:
  - `status`: `active` ou `inactive`
  - `orderBy`: `name`, `status` ou `date`
  - `order`: `ASC` ou `DESC`
  - `search`: string para busca textual
  - `page`: número da página
  - `startDate`: data inicial no formato YYYY-MM-DD
  - `endDate`: data final no formato YYYY-MM-DD (não pode ser anterior à `startDate`)

#### Especificações técnicas:

- **Request Query**: FindAllPatientQueryDto (`src/app/http/patients.dto.ts`)
- **Responses**:
  - 200 OK: Lista de pacientes retornada com sucesso
  - 400 Bad Request: Parâmetros inválidos
  - 403 Forbidden: Permissão insuficiente

#### Fluxo:

1. Recebimento dos filtros na requisição
2. Validação dos parâmetros
3. Construção da query para consulta no banco de dados
4. Execução da consulta com paginação (10 itens por página)
5. Retorno dos pacientes filtrados

### 3. Busca de paciente por ID

Exibe um paciente específico cadastrado no sistema.

**Rota:** `GET /patients/:id`

#### Regras de negócio

- **Permissões necessárias**: `gerente`, `enfermeira`, `especialista`
- O parâmetro `id` deve ser um UUID válido
- Retorna erro se o paciente não for encontrado

#### Especificações técnicas:

- **Response**:
  - 200 OK: Retorna os dados do paciente
  - 404 Not Found: Paciente não encontrado
  - 403 Forbidden: Permissão insuficiente

#### Fluxo:

1. Recebimento do `id` nos parâmetros da requisição
2. Verificação da existência do paciente no banco de dados
3. Retorno dos dados do paciente

### 4. Inativação do paciente

Inativa um paciente, tornando-o não visível no sistema.

**Rota:** `PATCH /patients/:id/inactivate`

#### Regras de negócio

- **Permissões necessárias**: `gerente`, `enfermeira`
- O parâmetro `id` deve ser um UUID válido
- Não é possível inativar um paciente já inativo

#### Especificações técnicas:

- **Responses**:
  - 200 OK: Paciente inativado com sucesso
  - 400 Bad Request: Paciente já inativo
  - 404 Not Found: Paciente não encontrado
  - 403 Forbidden: Permissão insuficiente

#### Fluxo:

1. Recebimento do `id` nos parâmetros da requisição
2. Verificação da existência e status do paciente
3. Atualização do status para `inactive`
4. Retorno da confirmação

### 5. Busca dos contatos de apoio do paciente

Lista todos os contatos de apoio cadastrados para um paciente específico.

**Rota:** `GET /patients/:id/patient-supports`

#### Regras de negócio

- **Permissões necessárias**: `gerente`, `enfermeira`,`especialista`, `paciente` (apenas para seu próprio ID)
- O parâmetro `id` deve ser um UUID válido

#### Especificações técnicas:

- **Responses**:
  - 200 OK: Retorna lista de contatos de apoio.
  - 404 Not Found: Paciente não encontrado
  - 403 Forbidden: Permissão insuficiente

#### Fluxo:

1. Validação do token de acesso e permissões
2. Verificação da existência do paciente
3. Busca acompanhantes no banco de dados
4. Retorna lista formatada

### 6. Exclusão do paciente

Remove permanentemente um registro de paciente do sistema.

**Rota:** `DELETE /patients/:id/inactivate`

#### Regras de negócio

- O parâmetro `id` deve ser um UUID válido

#### Especificações técnicas:

- **Responses**:
  - 200 OK: Paciente removido com sucesso
  - 404 Not Found: Paciente não encontrado
  - 403 Forbidden: Permissão insuficiente

#### Fluxo:

1. Recebimento do `id` nos parâmetros da requisição
2. Verificação da existência do paciente
3. Remoção do paciente no banco de dados
4. Retorno da confirmação

### 7. Atualização dos dados do paciente

Atualiza informações cadastrais de um paciente existente.

**Rota:** `PUT /patients/:id`

#### Regras de negócio

- O parâmetro `id` deve ser um UUID válido
- Todos os campos obrigatórios devem ser fornecidos
- O CPF deve ser válido e não usado por outro usuário

#### Especificações técnicas:

- **Responses**:
  - 200 OK: Paciente atualizado com sucesso.
  - 400 Bad Request: CPF já cadastrado.
  - 404 Not Found: Paciente não encontrado

#### Fluxo:

1. Recebimento do `id` nos parâmetros na url da requisição e `body`
2. Verificação da existência do paciente
3. Verificação de CPF válido e verificação se já está em uso por outro usuário
4. Retorno da atualização dos dados do paciente

### 8. Listagem de formulários pendentes

Lista formulários pendentes por paciente.

**Rota:** `GET forms/status`

#### Especificações técnicas:

- **Responses**:
  - 200 OK: formulário(s) pendente(s) no total.
  - 400 Bad Request: Erro ao verificar formulários pendentes.

#### Fluxo:

1. Verificação e separação dos formulários pendentes e completos
2. Retorno dos formulários
