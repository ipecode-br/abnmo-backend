# Padrão de respostas

Todas as respostas da API seguem um formato padronizado com o campo `success` indicando o resultado da operação.

---

## Resposta de sucesso simples

Usada em operações que não retornam dados (criação, atualização, cancelamento, exclusão):

```json
{
  "success": true,
  "message": "Atendimento cadastrado com sucesso."
}
```

Tipo TypeScript: `BaseResponse`

```typescript
import { BaseResponse } from '@/common/dtos';

async create(@Body() dto: CreateAppointmentDto): Promise<BaseResponse> {
  await this.createAppointmentUseCase.execute(dto);
  return { success: true, message: 'Atendimento cadastrado com sucesso.' };
}
```

---

## Resposta com dados

Usada em operações que retornam dados (listagens, detalhes):

```json
{
  "success": true,
  "message": "Lista de atendimentos retornada com sucesso.",
  "data": {
    "appointments": [...],
    "total": 42
  }
}
```

O formato de `data` é definido pelo schema de response da feature. Exemplo:

```typescript
// src/domain/schemas/appointments/responses.ts
export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentSchema),
    total: z.number(),
  }),
});

// src/app/http/appointments/appointments.dtos.ts
export class GetAppointmentsResponse extends createZodDto(getAppointmentsResponseSchema) {}
```

No controller:

```typescript
async getAppointments(@Query() query: GetAppointmentsQuery, @User() user: AuthUser): Promise<GetAppointmentsResponse> {
  const data = await this.getAppointmentsUseCase.execute({ user, ...query });

  return {
    success: true,
    message: 'Lista de atendimentos retornada com sucesso.',
    data,
  };
}
```

---

## Resposta de erro

Gerada automaticamente pelo `HttpExceptionFilter` em caso de exceções. Veja [tratamento de erros](error-handling.md) para mais detalhes.

```json
{
  "success": false,
  "message": "Paciente não encontrado."
}
```

Em erros de validação Zod, o campo `fields` é incluído:

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

---

## Regras

- `success: true` em todas as respostas bem-sucedidas.
- `success: false` em todas as respostas de erro.
- `message` sempre presente — em português (pt-BR), descritivo e orientado ao usuário.
- `data` somente quando a rota retorna informações concretas.
- Nunca retornar objetos brutos diretamente do controller — sempre usar o formato padronizado.
