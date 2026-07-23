# Camada de domínio

A camada de domínio (`src/domain`) contém as definições centrais do sistema: **Entities**, **Enums** e **Schemas**. Nenhuma lógica de negócio vive aqui — apenas contratos e estruturas de dados.

```
src/domain/
├── entities/    # Entidades TypeORM (todas estendem BaseEntity)
├── enums/       # Constantes `as const` + tipos derivados
└── schemas/     # Schemas Zod (entidade, request, response)
```

---

## Entities

Entities são classes TypeORM que representam tabelas no banco. Todas estendem `BaseEntity`, que fornece `id` (UUID v7), `createdAt` e `updatedAt`. Todas implementam os schemas Zod correspondentes.

### Padrão

```typescript
// src/domain/entities/appointment.ts
import type { AppointmentSchema } from '../schemas/appointments';
import { Column, Entity, JoinColumn, ManyToOne } from 'typeorm';
import { BaseEntity } from './base';
import { User } from './user';

@Entity('appointments')
export class Appointment extends BaseEntity implements AppointmentSchema {
  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'varchar', length: 255 })
  status: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  annotation: string | null;

  @Column({ type: 'varchar', length: 64, nullable: true })
  professionalName: string | null;

  @Column('uuid')
  createdBy: string;

  @ManyToOne(() => User)
  @JoinColumn({ name: 'patient_id' })
  patient: User;

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'specialist_id' })
  specialist: User | null;
}
```

### Regras

- Sempre estender `BaseEntity` — nunca declarar `id`, `createdAt` ou `updatedAt` manualmente.
- Sempre implementar os schemas Zod correspondentes.
- Campos enum referenciam o array `as const`: `default: 'scheduled'`.
- Campos opcionais usam `nullable: true` no `@Column` e `| null` no tipo.
- Relacionamentos declarados com `@ManyToOne`, `@OneToMany`, etc.
- Não existe entidade `Patient` dedicada — pacientes são `User` com `role: 'patient'`.
- Dados anônimos de saúde (diagnóstico, demografia) ficam na entidade `Survey` (`@OneToOne` com `User`).

### Registro de entidades

Entidades são registradas centralmente em `src/domain/entities/database.ts` no array `DATABASE_ENTITIES`. Nos módulos, use `TypeOrmModule.forFeature([...])` apenas com as entidades necessárias.

---

## Enums

Enums são arrays `as const` com tipos derivados. Permitem usar os valores no TypeORM e como tipo TypeScript sem duplicação.

### Padrão

```typescript
// src/domain/enums/appointments.ts
export const APPOINTMENT_STATUSES = [
  'scheduled',
  'canceled',
  'completed',
  'no_show',
] as const;

export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];

export const APPOINTMENTS_ORDER_BY = [
  'date',
  'patient',
  'status',
  'category',
  'condition',
  'professional',
] as const;

export type AppointmentsOrderBy = (typeof APPOINTMENTS_ORDER_BY)[number];
```

### Regras

- Nomes no formato `SCREAMING_SNAKE_CASE` para arrays, `PascalCase` para tipos.
- Um arquivo por domínio: `appointments.ts`, `patients.ts`, `users.ts`, etc.
- Nunca use o keyword `enum` do TypeScript.

---

## Schemas Zod

Schemas Zod são a fonte de verdade para validação. DTOs são derivados diretamente deles — nunca escritos manualmente.

### Estrutura de pastas

```
src/domain/schemas/
├── base.ts            # baseEntitySchema, baseResponseSchema
├── query.ts           # Schemas reutilizáveis de query (queryDateSchema, queryPageSchema, etc.)
├── shared.ts          # Schemas primitivos (uuidSchema, nameSchema, emailSchema, datetimeSchema...)
├── appointments/
│   ├── index.ts       # appointmentSchema (schema completo da entidade)
│   ├── requests.ts    # Schemas de request (body + query)
│   └── responses.ts   # Schemas de response
└── ...
```

### Schema da entidade (`index.ts`)

Define a estrutura completa da entidade. Campos de data usam `datetimeSchema` (`z.coerce.date()`):

```typescript
import { z } from 'zod';
import { baseEntitySchema } from '../base';
import {
  datetimeSchema,
  uuidSchema,
  nameSchema,
  specialtySchema,
  patientConditionSchema,
} from '../shared';

export const appointmentSchema = z.strictObject({
  ...baseEntitySchema.shape, // id, updatedAt, createdAt
  date: datetimeSchema,
  status: z.enum(APPOINTMENT_STATUSES).default('scheduled'),
  category: specialtySchema,
  condition: patientConditionSchema,
  annotation: z.string().max(500).nullable(),
  professionalName: nameSchema.nullable(),
  createdBy: uuidSchema,
});
```

### Schemas de request (`requests.ts`)

Schemas de body para criação/atualização fazem `.pick()` dos campos da entidade.

```typescript
import { z } from 'zod';
import { specialtySchema } from '../shared';
import { appointmentSchema } from '.';
import { patientSchema } from '../patients';

export const createAppointmentSchema = z.strictObject({
  patientId: patientSchema.shape.id,
  category: specialtySchema.optional(),
  ...appointmentSchema.pick({
    date: true,
    condition: true,
    annotation: true,
    professionalName: true,
  }).shape,
});

export const updateAppointmentSchema = z.strictObject({
  ...appointmentSchema.pick({
    date: true,
    condition: true,
    annotation: true,
  }).shape,
});
```

Schemas de query usam `queryDateSchema` (aceita ISO date e datetime):

```typescript
export const getAppointmentsQuerySchema = z
  .object({
    patientId: z.string().optional(),
    search: querySearchSchema.optional(),
    status: z.enum(APPOINTMENT_STATUSES).optional(),
    orderBy: z.enum(APPOINTMENTS_ORDER_BY).default('date'),
    order: queryOrderSchema.default('DESC'),
    startDate: queryDateSchema.optional(),
    endDate: queryDateSchema.optional(),
    page: queryPageSchema,
    perPage: queryPerPageSchema,
    limit: queryLimitSchema,
  })
  .superRefine(validateEndDate);
```

### Schemas de response (`responses.ts`)

Definem o formato exato da resposta. `.pick()` da entidade e estendem `baseResponseSchema`:

```typescript
export const appointmentResponseSchema = appointmentSchema
  .pick({
    id: true,
    date: true,
    status: true,
    category: true,
    condition: true,
    annotation: true,
    professionalName: true,
    updatedAt: true,
    createdAt: true,
  })
  .extend({
    patient: patientSchema.pick({
      id: true,
      name: true,
      email: true,
      avatarUrl: true,
    }),
    specialist: userSchema
      .pick({ id: true, name: true, email: true, avatarUrl: true })
      .nullable(),
  });

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(appointmentResponseSchema),
    total: z.number(),
  }),
});
```

### Schemas compartilhados (`shared.ts`)

Primitivos reutilizáveis entre múltiplos schemas:

```typescript
export const uuidSchema = z.uuid({ version: 'v7' });
export const nameSchema = z.string().min(3).max(64);
export const emailSchema = z.email().min(1).max(254);
export const phoneSchema = z.string().min(10).max(11).regex(ONLY_NUMBERS_REGEX);
export const dateSchema = z.iso.date(); // "YYYY-MM-DD"
export const datetimeSchema = (() => {
  const schema = z.coerce.date(); // aceita string ISO e Date nativo
  schema._zod.processJSONSchema = (
    // hook para schema JSON do OpenAPI
    _ctx: unknown,
    json: Record<string, string>,
  ) => {
    json.type = 'string';
    json.format = 'date-time';
  };
  return schema;
})();
```

### Regras

- Campos de data (`date`, `createdAt`, `updatedAt`, `expiresAt`, etc.) usam `datetimeSchema` — tanto em schemas de entidade quanto de request. `z.coerce.date()` aceita strings ISO e objetos `Date` nativos.
- `datetimeSchema` inclui o hook `_zod.processJSONSchema` para gerar `{ type: 'string', format: 'date-time' }` na spec OpenAPI.
- Schemas de query usam `queryDateSchema` (alias de `datetimeSchema`).
- Use `z.coerce.number()` e `z.coerce.boolean()` para campos numéricos/booleanos em query strings.
- Regras de negócio complexas use `.superRefine()`.
- Exporte o tipo inferido quando necessário via `z.infer<typeof schema>`.
