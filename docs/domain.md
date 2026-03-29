# Camada de domínio

A camada de domínio (`/src/domain`) é o núcleo do sistema, contendo as definições centrais que as demais camadas consumem: **Entities**, **Enums** e **Schemas**. Nenhuma lógica de negócio vive aqui — apenas contratos e estruturas de dados.

```
src/domain/
├── entities/    # Entidades TypeORM (mapeamento para tabelas)
├── enums/       # Constantes tipadas (arrays as const + tipos derivados)
└── schemas/     # Schemas Zod (validação e contratos de request/response)
```

---

## Entities

Entities são classes TypeORM que representam tabelas no banco de dados. Cada entidade implementa o schema Zod correspondente para garantir consistência entre a validação e o modelo de dados.

### Padrão

```typescript
// src/domain/entities/appointment.ts
import { Column, CreateDateColumn, Entity, ManyToOne, PrimaryGeneratedColumn, UpdateDateColumn } from 'typeorm';
import { APPOINTMENT_STATUSES, type AppointmentStatus } from '../enums/appointments';
import type { AppointmentSchema } from '../schemas/appointments';
import { Patient } from './patient';

@Entity('appointments')
export class Appointment implements AppointmentSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patientId: string;

  @Column({ type: 'datetime' })
  date: Date;

  @Column({ type: 'enum', enum: APPOINTMENT_STATUSES, default: 'scheduled' })
  status: AppointmentStatus;

  @Column({ type: 'varchar', length: 500, nullable: true })
  annotation: string | null;

  @Column('uuid')
  createdBy: string;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @UpdateDateColumn({ type: 'datetime' })
  updatedAt: Date;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient: Patient;
}
```

### Regras

- Sempre use `@PrimaryGeneratedColumn('uuid')` como chave primária.
- Campos enum referenciam o array `as const` do enum correspondente: `enum: APPOINTMENT_STATUSES`.
- Campos opcionais usam `nullable: true` no `@Column` e `| null` no tipo TypeScript.
- Relacionamentos são declarados com `@ManyToOne`, `@OneToMany`, etc.
- A entidade deve implementar o schema Zod: `implements AppointmentSchema`.

### Registro global

Todas as entidades são exportadas em um array centralizado (`/src/domain/entities/index.ts`) registrado no `DatabaseModule`:

```typescript
export const DATABASE_ENTITIES = [
  User,
  Patient,
  Appointment,
  Referral,
  PatientSupport,
  PatientRequirement,
  Token,
];
```

Nas features, cada módulo registra apenas as entidades que usa via `TypeOrmModule.forFeature([...])`.

---

## Enums

Enums são arrays `as const` com tipos derivados. Esse padrão permite usar os valores como `enum` no TypeORM e como tipo TypeScript ao mesmo tempo, sem duplicação.

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
// → 'scheduled' | 'canceled' | 'completed' | 'no_show'

export const APPOINTMENTS_ORDER_BY = [
  'date',
  'patient',
  'status',
  'category',
] as const;

export type AppointmentsOrderBy = (typeof APPOINTMENTS_ORDER_BY)[number];
```

### Regras

- Nomes no formato `SCREAMING_SNAKE_CASE` para arrays de constantes.
- Tipos derivados no formato `PascalCase`.
- Tipos de status no sufixo `Status` (ex: `AppointmentStatus`, `PatientStatus`).
- Tipos de ordenação no sufixo `OrderBy` (ex: `AppointmentsOrderBy`).
- Um arquivo por domínio: `appointments.ts`, `patients.ts`, `users.ts`, etc.

### Enums disponíveis

| Arquivo | Exports Principais |
|---|---|
| `appointments.ts` | `APPOINTMENT_STATUSES`, `APPOINTMENTS_ORDER_BY` |
| `patients.ts` | `PATIENT_STATUSES`, `PATIENT_GENDERS`, `PATIENT_RACES`, `PATIENT_CONDITIONS`, `PATIENT_NMO_DIAGNOSTICS` |
| `users.ts` | `USER_ROLES`, `USER_STATUSES` |
| `shared.ts` | `SPECIALTY_CATEGORIES` |
| `referrals.ts` | `REFERRAL_STATUSES`, `REFERRALS_ORDER_BY` |
| `patient-requirements.ts` | `PATIENT_REQUIREMENT_TYPES`, `PATIENT_REQUIREMENT_STATUSES` |
| `tokens.ts` | `AUTH_TOKENS_MAPPING`, `AUTH_TOKEN_ROLES`, `ALLOWED_ROLES` |
| `queries.ts` | `QUERY_ORDERS`, `QUERY_PERIODS` |

---

## Schemas (Zod)

Schemas Zod são a fonte de verdade para validação de dados. DTOs são derivados diretamente de schemas — nunca são escritos manualmente.

### Estrutura de pastas

```
src/domain/schemas/
├── base.ts            # baseResponseSchema
├── query.ts           # baseQuerySchema e schemas primitivos de query
├── shared.ts          # Schemas primitivos reutilizáveis (name, email, phone...)
├── appointments/
│   ├── index.ts       # appointmentSchema (schema completo da entidade)
│   ├── requests.ts    # createAppointmentSchema, updateAppointmentSchema, getAppointmentsQuerySchema
│   └── responses.ts   # getAppointmentsResponseSchema
├── patients/
│   ├── index.ts
│   ├── requests.ts
│   └── responses.ts
└── ...                # Mesmo padrão para cada domínio
```

### Schema da entidade (`index.ts`)

Define a estrutura completa da entidade como um objeto Zod estrito:

```typescript
// src/domain/schemas/appointments/index.ts
import { z } from 'zod';

export const appointmentSchema = z.object({
  id: z.string().uuid(),
  patientId: z.string().uuid(),
  date: z.coerce.date(),
  status: z.enum(APPOINTMENT_STATUSES),
  category: z.enum(SPECIALTY_CATEGORIES),
  condition: z.enum(PATIENT_CONDITIONS),
  annotation: z.string().max(500).nullable(),
  professionalName: z.string().max(64).nullable(),
  userId: z.string().uuid().nullable(),
  createdBy: z.string().uuid(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
}).strict();

export type AppointmentSchema = z.infer<typeof appointmentSchema>;
```

### Schemas de request (`requests.ts`)

Derivados do schema da entidade com `.pick()`, `.omit()` ou `.extend()`:

```typescript
// src/domain/schemas/appointments/requests.ts
import { z } from 'zod';

export const createAppointmentSchema = appointmentSchema
  .pick({
    patientId: true,
    date: true,
    condition: true,
    annotation: true,
    professionalName: true,
  })
  .extend({ category: specialtySchema.optional() })
  .strict();

export const updateAppointmentSchema = appointmentSchema.pick({
  date: true,
  condition: true,
  annotation: true,
});

export const getAppointmentsQuerySchema = z.object({
  patientId: z.string().optional(),
  status: z.enum(APPOINTMENT_STATUSES).optional(),
  orderBy: z.enum(APPOINTMENTS_ORDER_BY).default('date'),
  order: queryOrderSchema.default('DESC'),
  page: queryPageSchema,
  perPage: queryPerPageSchema,
}).refine(...);
```

### Schemas de response (`responses.ts`)

Definem o formato exato da resposta da API:

```typescript
// src/domain/schemas/appointments/responses.ts
import { z } from 'zod';
import { baseResponseSchema } from '../base';

export const getAppointmentsResponseSchema = baseResponseSchema.extend({
  data: z.object({
    appointments: z.array(
      appointmentSchema.extend({
        patient: z.object({
          name: z.string(),
          email: z.string(),
          avatarUrl: z.string().nullable(),
        }),
      }),
    ),
    total: z.number(),
  }),
});
```

### Schemas compartilhados (`shared.ts`)

Primitivos reutilizáveis entre múltiplos schemas:

```typescript
// src/domain/schemas/shared.ts
export const nameSchema = z.string().min(3).max(64);
export const emailSchema = z.string().min(1).max(64).email();
export const passwordSchema = z.string().min(8).max(64);
export const phoneSchema = z.string().min(10).max(11).regex(ONLY_NUMBERS_REGEX);
export const specialtySchema = z.enum(SPECIALTY_CATEGORIES);
```

### Regras

- Use sempre `.strict()` nos schemas de request para rejeitar campos desconhecidos.
- Use `z.coerce.date()` para campos de data vindos de query strings.
- Use `z.coerce.number()` e `z.coerce.boolean()` para campos numéricos/booleanos em query strings.
- Exporte o tipo inferido quando necessário: `export type CreateAppointmentInput = z.infer<typeof createAppointmentSchema>`.
- Valide regras de negócio complexas com `.refine()` ou `.superRefine()` diretamente no schema.
