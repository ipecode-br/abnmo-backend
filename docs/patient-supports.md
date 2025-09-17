# Contatos de apoio

Este documento descreve as rotas, regras de negócio e especificações técnicas referentes ao gerenciamento de contatos de apoio vinculados a pacientes no sistema.

## Estrutura de dados

### Campos do contato de apoio

| Campo        | Tipo   | Obrigatório | Descrição                                       |
| ------------ | ------ | ----------- | ----------------------------------------------- |
| `name`       | string | Sim         | Nome do contato (3-100 caracteres)              |
| `phone`      | string | Sim         | Telefone (11 dígitos, apenas números)           |
| `kinship`    | string | Sim         | Grau de parentesco                              |
| `patient_id` | UUID   | Sim         | ID do paciente ao qual o contato está vinculado |

## 1. Cadastrar contato de apoio

Cria um novo contato de apoio vinculado a um paciente.

**Rota**: `POST /patient-supports/:patientId`

### Regras de negócio

- **Permissões**: usuários `nurse`, `manager` ou `patient`;
- Um paciente só pode registrar contatos de apoio vinculados ao seu próprio cadastro.

### Especificações técnicas

- Request Params: `:patientId` (UUID do paciente)
- Request Body: CreatePatientSupportDto (`src/app/http/patient-supports/patient-supports.dtos.ts`)

### Fluxo

1. Verifica se o paciente existe;
2. Executa a operação para registrar o contato de apoio;
3. Em caso de sucesso, cria um log com dados da operação executada;
4. Retorna a resposta com o resultado da operação.

## 2. Buscar um contato de apoio

Retorna as informações de um contato de apoio específico.

**Rota**: `GET /patient-supports/:id`

### Regras de negócio

- **Permissões**: usuários autenticados;
- Um paciente só pode visualizar informações do contato de apoio vinculado ao seu próprio cadastro;

### Especificações técnicas

- Request Params: `:id` (UUID do contato de apoio).

### Fluxo

1. Verifica se o contato de apoio existe;
2. Retorna a resposta com o resultado da operação. Em caso de sucesso, retorna as informações do contato de apoio.

## 3. Alterar contato de apoio

Atualiza os dados de um contato de apoio existente.

**Rota**: `PUT /patient-supports/:id`

### Regras de negócio

- **Permissões**: usuários `nurse`, `manager` ou `patient`;
- Um paciente só pode alterar informações do contato de apoio vinculado ao seu próprio cadastro;

### Especificações técnicas

- Request Params: `:id` (UUID do contato de apoio);
- Request Body: UpdatePatientSupportDto (`src/app/http/patient-supports/patient-supports.dtos.ts`).

### Fluxo

1. Verifica se o contato de apoio existe;
2. Verifica se o usuário da requisição é um paciente. Se sim, verifica se o contato de apoio está vinculado a este paciente:
   - Caso positivo: prossegue com a execução;
   - Caso negativo: retorna erro de permissão e encerra a execução.
3. Realiza a alteração do contato de apoio no banco de dados;
4. Em caso de sucesso, cria um log com dados da operação executada;
5. Retorna a resposta com o resultado da operação.

## 4. Remover contato de apoio

Remove um contato de apoio existente.

**Rota**: `DELETE /patient-supports/:id`

### Regras de negócio

- **Permissões**: usuários `nurse`, `manager` ou `patient`;
- Um paciente só pode remover um contato de apoio vinculado ao seu próprio cadastro;

### Especificações técnicas

- Request Params: `:id` (UUID do contato de apoio).

### Fluxo

1. Verifica se o contato de apoio existe;
2. Verifica se o usuário da requisição é um paciente. Se sim, verifica se o contato de apoio está vinculado a este paciente:

- Caso positivo: prossegue com a execução;
- Caso negativo: retorna erro de permissão e encerra a execução.

3. Realiza a remoção do contato de apoio do banco de dados;
4. Em caso de sucesso, cria um log com dados da operação executada;
5. Retorna a resposta com o resultado da operação.

## Logs e auditoria

O sistema registra logs para as seguintes operações:

### Logs de sucesso

- **Cadastro de contato de apoio**: registra ID do contato, ID do paciente e nome do contato
- **Atualização de contato de apoio**: registra ID do contato, ID do paciente e nome do contato
- **Remoção de contato de apoio**: registra ID do contato, ID do paciente e nome do contato

### Logs de erro

- **Tentativa de operação em contato inexistente**: registra ID utilizado
- **Tentativa de operação sem permissão**: registra ID do usuário e ID do contato

## Métodos do repository

### Métodos públicos disponíveis

- `findById(id)`: Busca contato de apoio por ID com relações
- `findByPatientId(patientId)`: Busca todos os contatos de um paciente
- `create(patientSupport)`: Cria novo contato de apoio
- `update(patientSupport)`: Atualiza contato de apoio existente
- `remove(patientSupport)`: Remove contato de apoio permanentemente

## Códigos de resposta HTTP

### Respostas de sucesso

- **200 OK**: Operação realizada com sucesso (GET, PUT, DELETE)
- **201 Created**: Contato de apoio criado com sucesso (POST)

### Respostas de erro

- **400 Bad Request**: Dados de entrada inválidos ou regra de negócio violada
- **401 Unauthorized**: Token de autenticação ausente ou inválido
- **403 Forbidden**: Usuário não possui permissões necessárias para a operação
- **404 Not Found**: Contato de apoio ou paciente não encontrado
- **422 Unprocessable Entity**: Dados de entrada não passaram na validação do schema
- **500 Internal Server Error**: Erro interno do servidor

## Validações e restrições

### Validações de entrada

- **Nome**: Deve ter entre 3-100 caracteres
- **Telefone**: Deve conter apenas números e ter 11 dígitos
- **Grau de parentesco**: Campo obrigatório, string não vazia
- **UUID**: Parâmetros de ID devem ser UUIDs válidos

### Restrições de negócio

- Um contato de apoio deve estar sempre vinculado a um paciente válido
- Pacientes só podem gerenciar contatos de apoio vinculados ao próprio cadastro
- Não há limite máximo de contatos de apoio por paciente
- A remoção do contato de apoio é permanente e irreversível
