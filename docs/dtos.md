# DTOs

## O que é um DTO

DTO (Data Transfer Object) é a classe que representa os dados de entrada ou saída de uma rota. Todos os DTOs são derivados de schemas Zod via `createZodDto()` — **nunca** são escritos manualmente.

A validação é automática: o `nestjs-zod` intercepta todo `@Body()` e `@Query()` cujo tipo foi criado com `createZodDto()` e valida contra o schema.

---

## Convenção de nomenclatura

| Tipo                 | Padrão                  | Exemplo                   |
| -------------------- | ----------------------- | ------------------------- |
| Body de criação      | `Create{Entity}Body`    | `CreateAppointmentBody`   |
| Body de atualização  | `Update{Entity}Body`    | `UpdateAppointmentBody`   |
| Query de listagem    | `Get{Entities}Query`    | `GetAppointmentsQuery`    |
| Response de listagem | `Get{Entities}Response` | `GetAppointmentsResponse` |
| Response de detalhe  | `Get{Entity}Response`   | `GetPatientResponse`      |

> Nunca use o sufixo `Dto` — a convenção é `Body`, `Query` ou `Response`.

---

## Criando DTOs

Todos os DTOs de uma feature ficam em um único arquivo `{feature}.dtos.ts`. Use `createZodDto()` para derivar a classe do schema:

```typescript
// src/app/http/appointments/appointments.dtos.ts
import { createZodDto } from 'nestjs-zod';

import {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointments/requests';
import { getAppointmentsResponseSchema } from '@/domain/schemas/appointments/responses';

export class GetAppointmentsQuery extends createZodDto(
  getAppointmentsQuerySchema,
) {}

export class GetAppointmentsResponse extends createZodDto(
  getAppointmentsResponseSchema,
) {}

export class CreateAppointmentBody extends createZodDto(
  createAppointmentSchema,
) {}

export class UpdateAppointmentBody extends createZodDto(
  updateAppointmentSchema,
) {}
```

Uso nos controllers:

```typescript
@Get()
async getAppointments(
  @Query() query: GetAppointmentsQuery,    // validado automaticamente
  @User() user: RequestUser,
): Promise<GetAppointmentsResponse> { ... }

@Post()
async create(
  @User() user: RequestUser,
  @Body() body: CreateAppointmentBody,     // validado automaticamente
): Promise<BaseResponse> { ... }
```

---

## Como funciona a validação

1. O `@Body()` ou `@Query()` recebe o tipo do DTO.
2. O nestjs-zod detecta que a classe foi criada com `createZodDto()` (possui `.schema`).
3. Chama `schema.parse(value)` nos dados recebidos.
4. Em caso de erro, retorna `400` com formato padronizado:

```json
{
  "success": false,
  "message": "Os dados enviados são inválidos.",
  "fields": [
    {
      "field": "date",
      "error": "Invalid input: expected string, received Date"
    },
    { "field": "patientId", "error": "Invalid UUID" }
  ]
}
```

**Não é necessário adicionar pipes manualmente** — a validação é automática para qualquer DTO criado com `createZodDto()`.

---

## `BaseResponse`

Resposta padrão para rotas que não retornam dados (criação, atualização, cancelamento):

```typescript
// src/common/dtos.ts
import { createZodDto } from 'nestjs-zod';
import { baseResponseSchema } from '@/domain/schemas/base';
import { uuidParamsSchema } from '@/domain/schemas/shared';

export class BaseResponse extends createZodDto(baseResponseSchema) {}
// → { success: boolean; message: string }

export class UUIDParams extends createZodDto(uuidParamsSchema) {}
// → { id: string }  (UUID v7)
```

## `UUIDParams`

DTO compartilhado para validar parâmetros de rota `:id`. Usado com `@Param()` destructuring em controllers:

```typescript
@Get(':id')
async getById(@Param() { id }: UUIDParams) {
  // id é uma string UUID v7 validada pelo ZodValidationPipe global
}
```

O schema `uuidParamsSchema` usa `uuidSchema` (`z.uuid({ version: 'v7' })`) definido em `src/domain/schemas/shared.ts`. O `ZodValidationPipe` global valida automaticamente qualquer `@Param()` tipado como `UUIDParams`.

Strings inválidas retornam **400** com `"Os dados enviados são inválidos."` antes mesmo de chegar ao controller — sem round-trip ao banco.

### Uso

```typescript
@Post()
async create(@Body() body: CreateAppointmentBody): Promise<BaseResponse> {
  await this.createAppointmentUseCase.execute(body);
  return { success: true, message: 'Atendimento cadastrado com sucesso.' };
}
```

## Regras

- Um único arquivo `{feature}.dtos.ts` por feature — nunca criar arquivos separados por DTO.
- Nunca definir campos manualmente na classe DTO — toda validação vem do schema Zod.
- Nunca importar schemas de outros domínios para criar DTOs — cada feature usa apenas seus schemas.
- Para respostas tipadas com `data`, crie um schema de response em `responses.ts` e derive o DTO.
- Nomes seguem `PascalCase` com sufixo funcional: `Body`, `Query` ou `Response`.
- Para parâmetros de rota `:id`, use `@Param() { id }: UUIDParams` — **nunca** `@Param('id') id: string` para UUIDs.
