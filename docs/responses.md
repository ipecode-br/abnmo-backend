# Padrão de respostas

Todas as respostas da API seguem o formato `{ success: boolean, message: string, data?: ... }`.

---

## Resposta de sucesso simples

Usada em operações que não retornam dados (criação, atualização, cancelamento):

```json
{
  "success": true,
  "message": "Atendimento cadastrado com sucesso."
}
```

Tipo: `BaseResponse` (`@/common/dtos`). Declarado no controller com `@ZodResponse`:

```typescript
@Post()
@ZodResponse({ type: BaseResponse, status: 201 })
async create(@Body() body: CreateAppointmentBody): Promise<BaseResponse> {
  await this.createAppointmentUseCase.execute(body);
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
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});

// src/app/http/appointments/appointments.dtos.ts
export class GetAppointmentsResponse extends createZodDto(
  getAppointmentsResponseSchema,
) {}

// Controller
@Get()
@ZodResponse({ type: GetAppointmentsResponse, status: 200 })
async getAppointments(@Query() query: GetAppointmentsQuery, @User() user: RequestUser) {
  const data = await this.getAppointmentsUseCase.execute({ user, ...query });
  return { success: true, message: 'Lista retornada com sucesso.', data };
}
```

---

## `@ZodResponse` — obrigatório

Todo endpoint deve usar `@ZodResponse({ type, status })` — **nunca** `@ApiResponse` para validação de resposta.

| HTTP  | Quando                                                       |
| :---: | ------------------------------------------------------------ |
| `200` | GET que retorna dados, PUT/PATCH que retornam confirmação     |
| `201` | POST que cria um recurso                                      |

O `ZodSerializerInterceptor` global valida a resposta contra o schema em runtime. Campos extras ou tipos incorretos causam erro 500 (`ZodSerializationException`).

`@ApiOperation` é usado apenas para o sumário no Swagger, sem efeito na validação.

> **Exceção**: `GET /status` usa `@ApiResponse` + `@Res()` para status HTTP dinâmico (200 ou 503). A validação da resposta é feita manualmente via `getStatusResponseSchema.parse()`.

---

## Mapeamento de resposta nos use-cases

**Nunca** retorne entidades TypeORM diretamente. O `ZodSerializerInterceptor` valida respostas com `.strict()` — qualquer propriedade extra (ex: `createdBy`, `updatedAt` desnecessário, objetos de relação completos) causa erro de serialização.

Mapeie entidades para objetos planos contendo apenas os campos definidos no schema de response:

```typescript
return {
  appointments: appointments.map((a) => ({
    id: a.id,
    date: a.date,
    status: a.status,
    category: a.category,
    condition: a.condition,
    annotation: a.annotation,
    professionalName: a.professionalName,
    updatedAt: a.updatedAt,
    createdAt: a.createdAt,
    patient: {
      id: a.patient.id,
      name: a.patient.name,
      email: a.patient.email,
      avatarUrl: a.patient.avatarUrl,
    },
    specialist: a.specialist
      ? {
          id: a.specialist.id,
          name: a.specialist.name,
          email: a.specialist.email,
          avatarUrl: a.specialist.avatarUrl,
        }
      : null,
  })),
  total,
};
```

---

## Resposta de erro

Gerada automaticamente pelo `HttpExceptionFilter`. Ver [tratamento de erros](error-handling.md).

```json
{
  "success": false,
  "message": "Paciente não encontrado."
}
```

---

## Regras

- `success: true` em todas as respostas bem-sucedidas, `false` nas de erro.
- `message` sempre presente — em **português (pt-BR)**.
- `data` somente quando a rota retorna informações — nunca `null` ou `undefined`.
- Todo endpoint usa `@ZodResponse({ type, status })`.
- Nunca retornar entidades TypeORM diretamente — mapear para objetos planos.
