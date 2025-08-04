# Contatos de Apoio

Este documento descreve os endpoints, regras de negócio e especificações técnicas referentes ao gerenciamento de contatos de apoio vinculados a pacientes no sistema.

## Endpoints

### 1. Criar contato de apoio

Cria um novo contato de apoio vinculado a um paciente.

**Rota**: `POST /patient-supports/:patientId`

#### Regras de Negócio:

- Apenas usuários com roles `admin`, `nurse`, `manager` ou o próprio paciente (`patient`) podem criar contatos;
- Um paciente só pode criar contatos vinculados ao seu próprio `patientId`;
- Todos os campos obrigatórios devem ser fornecidos e válidos.

#### Especificações Técnicas:

- Request Body: CreatePatientSupportDto (`src/app/http/patient-supports/patient-supports.dtos.ts`)

### 2. Listar contatos de apoio

Retorna uma lista de contatos de apoio.

**Rota**: `GET /patient-supports`

#### Regras de Negócio:

- Disponível para todos os usuários autenticados;

### 3. Buscar contato de apoio por ID

Retorna os detalhes de um contato de apoio específico.

**Rota**: `GET /patient-supports/:id`

#### Regras de Negócio:

- Apenas usuários autenticados podem acessar;
- Caso o usuário seja um paciente, ele só pode acessar seus próprios contatos.

#### Especificações Técnicas:

- Parâmetro de rota: `id` (UUID do contato);
- Verificação de permissão se `user.role === 'patient'`:
  - O `user.id` deve ser igual ao `patientId` do contato.

### 4. Atualizar contato de apoio

Atualiza os dados de um contato de apoio existente.

**Rota**: `PUT /patient-supports/:id`

#### Especificações Técnicas:

- Request Body: UpdatePatientSupportDto (`src/app/http/patient-supports/patient-supports.dtos.ts`);
- Verificação de acesso baseada no `role` e `patientId`.

### 5. Remover contato de apoio

Remove um contato de apoio pelo seu ID.

**Rota**: `DELETE /patient-supports/:id`

#### Regras de Negócio:

- Apenas usuários com roles `admin`, `nurse`, `manager`, ou o paciente vinculado podem remover;
- O contato deve existir;
- Pacientes só podem remover seus próprios contatos.

#### Especificações Técnicas:

- Parâmetro de rota: `id` (UUID do contato de apoio);
- Requer autenticação e verificação de permissão semelhante à rota de update.

## Considerações Técnicas

- Apenas usuários com roles `admin`, `nurse`, `manager`, ou o próprio paciente vinculado ao contato podem atualizar;
- O contato deve existir;
- O paciente só pode atualizar se o `patientId` do contato for igual ao `user.id`.
- Os contatos são armazenados com referência ao `patientId`;
- Operações de leitura, criação, atualização e remoção são transacionais;
