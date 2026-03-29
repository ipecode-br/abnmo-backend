# DTOs

## O que é um DTO

DTO (Data Transfer Object) é a classe que representa os dados de entrada ou saída de uma rota. No ABNMO, todos os DTOs são derivados diretamente dos schemas Zod definidos em `/src/domain/schemas`. Nunca são escritos manualmente — a definição dos campos, tipos e validações vive no schema.

---

## Criando DTOs

Todos os DTOs de uma feature ficam em um único arquivo `{feature}.dtos.ts`. Use `createZodDto()` da biblioteca `nestjs-zod` para derivar a classe do schema correspondente:

```typescript
// src/app/http/appointments/appointments.dtos.ts
import { createZodDto } from 'nestjs-zod';

import {
  createAppointmentSchema,
  getAppointmentsQuerySchema,
  updateAppointmentSchema,
} from '@/domain/schemas/appointments/requests';
import { getAppointmentsResponseSchema } from '@/domain/schemas/appointments/responses';

export class GetAppointmentsQuery extends createZodDto(getAppointmentsQuerySchema) {}
export class GetAppointmentsResponse extends createZodDto(getAppointmentsResponseSchema) {}
export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
export class UpdateAppointmentDto extends createZodDto(updateAppointmentSchema) {}
```

O `createZodDto()` cria uma classe com o schema Zod anexado como propriedade estática `.schema`. O `GlobalZodValidationPipe` detecta essa propriedade automaticamente e valida os dados de entrada a cada requisição.

---

## Como funciona a validação

O `GlobalZodValidationPipe` é registrado globalmente em `main.ts`. Ele intercepta todos os parâmetros decorados com `@Body()` e `@Query()`, e:

1. Verifica se o metatipo possui a propriedade `.schema` (ou seja, foi criado com `createZodDto()`).
2. Chama `schema.parse(value)` no dado recebido.
3. Em caso de erro, lança `BadRequestException` com o formato padronizado:

```json
{
  "success": false,
  "message": "Os dados enviados são inválidos.",
  "fields": [
    { "field": "date", "error": "Invalid date" },
    { "field": "patientId", "error": "Invalid uuid" }
  ]
}
```

Não há necessidade de adicionar pipes manualmente nos controllers — a validação é automática para qualquer DTO criado com `createZodDto()`.

---

## Convenção de nomenclatura

| Tipo | Padrão | Exemplo |
|---|---|---|
| Criação | `Create{Entity}Dto` | `CreateAppointmentDto` |
| Atualização | `Update{Entity}Dto` | `UpdateAppointmentDto` |
| Query de listagem | `Get{Entities}Query` | `GetAppointmentsQuery` |
| Response de listagem | `Get{Entities}Response` | `GetAppointmentsResponse` |
| Response de detalhe | `Get{Entity}Response` | `GetPatientResponse` |

---

## `BaseResponse`

Resposta padrão para rotas que não retornam dados (ex: criação, atualização, cancelamento):

```typescript
// src/common/dtos.ts
import { createZodDto } from 'nestjs-zod';
import { baseResponseSchema } from '@/domain/schemas/base';

export class BaseResponse extends createZodDto(baseResponseSchema) {}
// → { success: boolean; message: string }
```

Use `BaseResponse` como tipo de retorno de qualquer rota que não precise de `data`:

```typescript
async create(@Body() dto: CreateAppointmentDto): Promise<BaseResponse> {
  await this.createAppointmentUseCase.execute(dto);
  return { success: true, message: 'Atendimento cadastrado com sucesso.' };
}
```

---

## Regras

- Um único arquivo `{feature}.dtos.ts` por feature — nunca criar arquivos separados por DTO.
- Nunca definir campos manualmente na classe DTO — toda validação vem do schema Zod.
- Nunca importar schemas de outros domínios para criar DTOs — cada feature usa apenas seus próprios schemas.
- Para respostas tipadas com `data`, crie um schema de response em `/src/domain/schemas/{feature}/responses.ts` e derive o DTO a partir dele.
