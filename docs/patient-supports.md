# Contatos de Apoio

Este documento descreve os endpoints, regras de negócio e especificações técnicas referentes ao gerenciamento de contatos de apoio vinculados a pacientes no sistema.

---

## Endpoints

### 1. Criar contato de apoio

Cria um novo contato de apoio vinculado a um paciente.

**Rota**: `POST /patient-supports/:patientId`

#### Regras de Negócio:

- Apenas usuários com roles `admin`, `nurse`, `manager` ou o próprio paciente (`patient`) podem criar contatos;
- Um paciente só pode criar contatos vinculados ao seu próprio `patientId`;
- Todos os campos obrigatórios devem ser fornecidos e válidos.

#### Especificações Técnicas:

- Parâmetro de rota: `patientId` (UUID válido do paciente);
- Body: objeto validado por Zod (`CreatePatientSupportSchema`);
- Autenticação: obrigatória (exceto com `@Public()` - não aplicável aqui);
- Role necessária: `admin`, `nurse`, `manager` ou `patient`.

---

### 2. Listar contatos de apoio

Retorna uma lista paginada de contatos de apoio com possibilidade de filtros e ordenação.

**Rota**: `GET /patient-supports`

#### Regras de Negócio:

- Disponível para todos os usuários autenticados;
- Pode ser filtrado por nome, telefone ou paciente;
- Suporta paginação (`page`, `limit`) e ordenação (`orderBy`, `orderDirection`).

#### Especificações Técnicas:

- Query Params (validados via Zod):
  - `page`: número da página (opcional, default: 1);
  - `limit`: quantidade por página (opcional, default: 10);
  - `orderBy`: campo para ordenação (`name`, `createdAt`, etc.);
  - `orderDirection`: `asc` ou `desc`;
  - `search`: texto para busca livre;
- Retorna uma lista de objetos com metadados de paginação.

---

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

---

### 4. Atualizar contato de apoio

Atualiza os dados de um contato de apoio existente.

**Rota**: `PUT /patient-supports/:id`

#### Regras de Negócio:

- Apenas usuários com roles `admin`, `nurse`, `manager`, ou o próprio paciente vinculado ao contato podem atualizar;
- O contato deve existir;
- O paciente só pode atualizar se o `patientId` do contato for igual ao `user.id`.

#### Especificações Técnicas:

- Parâmetro de rota: `id` (UUID do contato de apoio);
- Body: objeto validado por Zod (`UpdatePatientSupportSchema`);
- Verificação de acesso baseada no `role` e `patientId`.

---

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

---

## Regras de Negócio Gerais

- **Roles**:
  - `admin`, `nurse`, `manager`: acesso completo a todos os contatos;
  - `patient`: acesso restrito apenas aos seus próprios contatos;
- **Validação**:
  - Todas as entradas são validadas com Zod;
  - IDs devem ser UUIDs válidos;
  - Campos obrigatórios são validados individualmente;
- **Autorização**:
  - Implementada via guards + decorators `@Roles()` e `@CurrentUser()`;
  - Verificação adicional para garantir que pacientes só acessem seus dados;
- **Erros**:
  - `400`: dados inválidos;
  - `403`: acesso negado por permissão;
  - `404`: contato não encontrado;
- **Segurança**:
  - Todas as rotas requerem token JWT válido;
  - Cookies `access_token` devem estar presentes (exceto se usar headers).

---

## Considerações Técnicas

- Os contatos são armazenados com referência ao `patientId`;
- Operações de leitura, criação, atualização e remoção são transacionais;
- Todos os retornos seguem o envelope padrão `{ success, message, data? }`;
- As validações são feitas em múltiplos níveis: schema Zod, guard de role, checagem manual de vínculo com o paciente.

---

## Exemplo de Resposta

```json
{
  "success": true,
  "message": "Contato de apoio atualizado com sucesso."
}
```

```json
{
  "success": false,
  "message": "Você não tem permissão para acessar este recurso."
}
```
