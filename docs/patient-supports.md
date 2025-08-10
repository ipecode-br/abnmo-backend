# Contatos de Apoio

Este documento descreve as rotas, regras de negócio e especificações técnicas referentes ao gerenciamento de contatos de apoio vinculados a pacientes no sistema.

## 1. Cadastrar contato de apoio

Cria um novo contato de apoio vinculado a um paciente.

**Rota**: `POST /patient-supports/:patientId`

### Regras de negócio

- **Permissões**: usuários `admin`, `nurse`, `manager` ou `patient`;
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

- **Permissões**: usuários autenticados;
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

- **Permissões**: todos os usuários autenticados;
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
