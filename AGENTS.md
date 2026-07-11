# ABNMO Backend — Agent Guide

NestJS + TypeORM + MySQL + Zod API.

## Quick commands

| Command                                    | What it does                                             |
| ------------------------------------------ | -------------------------------------------------------- |
| `npm run dev`                              | Docker up → wait for DB → migrate → `nest start --watch` |
| `npm run validate`                         | ESLint **+** `tsc --noEmit` (both in one command)        |
| `npm run lint:prettier:check`              | Prettier check only                                      |
| `npm run lint:prettier:fix`                | Prettier fix only                                        |
| `npm run test:prepare && npm run test:e2e` | Full E2E run                                             |

## Architecture

- **Entrypoint**: `src/app/main.ts` (HTTP), `src/app/lambda.ts` (Lambda via `@vendia/serverless-express`)
- **Feature modules**: `src/app/http/{feature}/` — `{feature}.module.ts`, `.controller.ts`, `.dtos.ts`, `use-cases/{action}-{feature}.use-case.ts`
- **Entities**: `src/domain/entities/`, registered centrally in `DATABASE_ENTITIES` in `src/domain/entities/database.ts`
- **Zod schemas** (source of truth for validation): `src/domain/schemas/{entity}/` — `index.ts`, `requests.ts`, `responses.ts`
- **Enums**: `as const` arrays in `src/domain/enums/`, **not** TypeScript `enum` keyword
- **Path alias**: `@/` → `./src/`

## Patient data model

- **No dedicated `Patient` entity** — patients are `User` records with `role: 'patient'`
- **Sensitive/identifiable data** (name, phone, CPF, email, SUS ID) → `User` entity
- **Anonymous demographic & clinical data** (birthday, gender, race, address, diagnosis, etc.) → `Survey` entity
- `User` has a `@OneToOne` relation to `Survey` for survey data
- **Never** join `User` in statistics queries — query `Survey` only
- **Statistics must never return sensitive or linkable data** — only aggregate counts, percentages, etc.

## Auth & permissions

- **Session-based auth in HTTP-only signed cookies** (no `Authorization` header)
- Global guards (registered in `AuthModule`, evaluated in order): `AuthGuard` → `RolesGuard` → `FeatureGuard`
- **Admin** bypasses `RolesGuard` (regardless of `@Roles()`) and `can()` (returns `true` unconditionally)
- User roles (from `USER_ROLES`): `admin`, `member`, `specialist`, `patient`

### Decorators

| Decorator            | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `@Public()`          | Skip `AuthGuard`                          |
| `@Roles(['member'])` | Require role — admin always bypasses      |
| `@RequireFeature(X)` | Require feature(s) — see below            |
| `@User()`            | Injects `RequestUser` from cookie session |
| `@Cookies('name')`   | Injects raw cookie value                  |

### `@RequireFeature` decorator

Accepts `UserFeature` (single) or `UserFeature[]` (OR logic). If the user has **any** of the listed features, the guard passes — it never checks ownership.

```ts
@RequireFeature('create:appointment')
@RequireFeature(['read:survey', 'read:survey:others'])  // OR: either feature grants access
```

The guard only validates feature existence. Ownership is enforced separately in use cases via `can()`.

### `can()` — use-case level authorization

Imports from `@/common/authorization/can`. Use inside use cases to check both feature ownership and resource ownership.

```ts
import { can } from '@/common/authorization/can';

// Single feature + single owner: user must have the feature AND match the ID
can(user, 'update:user', targetId);

// Multi-feature OR: user must have at least ONE feature AND pass ownership
can(
  user,
  ['update:appointment', 'update:appointment:others'],
  appointment.specialist?.id,
);

// Multi-feature OR + multi-owner: user must have a feature AND match AT LEAST ONE owner
can(
  user,
  ['update:appointment', 'update:appointment:others'],
  [appointment.specialist?.id || '', appointment.patient.id],
);
```

`compareToId` accepts `string | string[]`. Features ending with `:others` bypass ownership entirely. `undefined` `compareToId` skips ownership checks.

## Response conventions

- Portuguese (pt-BR) user messages, English log messages
- Format: `{ success: boolean, message: string, data?: ... }`

### Response validation

- All controller methods **must** use `@ZodResponse({ type: ResponseDto, status: N })` from `nestjs-zod`
- Never use `@ApiResponse` directly — it lacks runtime serialization and does not prevent data leakage
- `@ZodResponse` validates the response body against the DTO schema via the global `ZodSerializerInterceptor`
- Every `@ZodResponse` **must** include an explicit `status` code:

| HTTP  | When                                                                                          |
| ----- | --------------------------------------------------------------------------------------------- |
| `200` | Endpoint that returns resource data (GET list/detail, action that returns data)               |
| `201` | POST that creates a resource (`register/user`, `create-appointment`, `create-referral`, etc.) |

- Do **not** inject `@Res()` response objects manually — use NestJS return values + HTTP exceptions
- **Exception**: `GET /status` uses `@ApiResponse` + `@Res()` (not `@ZodResponse`) because it needs dynamic HTTP status — 200 when OK, 503 when services are down; it validates the response manually via `getStatusResponseSchema.parse()`

### Response mapping in use cases

When the response schema extends the entity schema with relations (nested objects) or picks a subset, **never** return raw TypeORM entities. The `ZodSerializerInterceptor` validates responses against the schema with `.strict()` — any extra properties (e.g. `createdBy`, `updatedAt`, `createdAt` from `BaseEntity`, or full relation objects) cause runtime failures.

Map entities to plain objects matching the schema exactly:

```ts
import type { AppointmentResponseSchema } from '@/domain/schemas/appointments/responses';

interface GetAppointmentsUseCaseOutput {
  appointments: AppointmentResponseSchema[];
  total: number;
}

// ...

return {
  appointments: appointments.map((appointment) => ({
    id: appointment.id,
    date: appointment.date,
    status: appointment.status,
    category: appointment.category,
    condition: appointment.condition,
    annotation: appointment.annotation,
    professionalName: appointment.professionalName,
    patient: {
      id: appointment.patient.id,
      name: appointment.patient.name,
      email: appointment.patient.email,
      avatarUrl: appointment.patient.avatarUrl,
    },
    specialist: appointment.specialist
      ? {
          id: appointment.specialist.id,
          name: appointment.specialist.name,
          email: appointment.specialist.email,
          avatarUrl: appointment.specialist.avatarUrl,
        }
      : null,
  })),
  total,
};
```

Import the inferred schema type from `responses.ts`, use it as the return type, and map every entity to a plain object with only the fields in the response schema.

## Database

- **synchronize: false** — migrations only
- Naming: `SnakeNamingStrategy` (columns auto-convert to snake_case)
- Inject `Repository<T>` directly in use-cases (no repository layer). For multi-table transactions, inject `DataSource`.
- Always use `.create()` then `.save()` (two steps), never `repository.save()` directly.

## Logging

- `LogModule` is global — never import it
- `@Log('event_name')` decorator on controller methods to register auditable events (e.g. `@Log('create_user')`); the event name is persisted through the request
- `@Log()` (class decorator) + `constructor(private readonly logger: LogService)` on use-cases
- All database write operations (create, update, delete) **must** log after successful execution
- On error, throw the correct HTTP exception with a `cause` property set to the original error; the exception's message goes to the response, and the cause is logged automatically by the exception filter

## Testing

- E2E only (no unit tests found). Run `test:prepare` first, then `test:e2e`
- Uses `jest --runInBand --detectOpenHandles`
- Test setup: `api(app).createAdminAndLogin()`, `.createNurseAndLogin()`, `.createSpecialistAndLogin()`, `.createManagerAndLogin()` — note `createPatientAndLogin` is currently commented out
- DB auto-clears between test files (via `setup.ts`)

## Patterns

### DTOs

Import `createZodDto` from `nestjs-zod`, pass the Zod schema — never define fields manually:

```ts
import { createZodDto } from 'nestjs-zod';
import { createAppointmentSchema } from '@/domain/schemas/appointments/requests';

export class CreateAppointmentBody extends createZodDto(
  createAppointmentSchema,
) {}
```

### Schema reuse

Prefer `.pick()`, `.extend()`, or `.merge()` from existing schemas before defining raw fields. Only create a new schema from scratch if no existing one covers the domain (e.g., a brand-new entity). This keeps schemas like `userSchema` as a single source of truth.

When fields are shared or no longer exist on an entity schema (e.g. after removing a column), reuse shared schemas (`nameSchema`, `emailSchema`, `phoneSchema`, etc.) from `src/domain/schemas/shared.ts` instead of defining raw `z.string()` or picking from unrelated entity schemas.

When composing a list response, extract a standalone list-item schema (e.g. `listSurveyResponseSchema`), export its inferred type (`ListSurveyResponse`), then use it in the response schema's array. This keeps the Zod type available for use-case return types and ensures runtime validation matches.

### Shared modules

| Module               | When to import        |
| -------------------- | --------------------- |
| `CryptographyModule` | Hashing, JWT, cookies |
| `MailModule`         | Sending emails        |
| `EnvModule`          | Accessing env vars    |
| `StorageModule`      | File uploads          |

`LogModule` is global — never import it.

### Exception mapping

| Exception                     | HTTP | When                           |
| ----------------------------- | ---- | ------------------------------ |
| `NotFoundException`           | 404  | Entity not found by ID         |
| `UnauthorizedException`       | 401  | Bad credentials, expired token |
| `ForbiddenException`          | 403  | Permission/ownership violation |
| `BadRequestException`         | 400  | Business rule violation        |
| `ConflictException`           | 409  | Duplicate email, CPF, etc.     |
| `ServiceUnavailableException` | 503  | External service (email, S3)   |

### Query schemas

Define query schemas using individual query field schemas directly — **do not** `.pick()` or `.extend()` from `baseQuerySchema`:

```ts
import {
  queryDateSchema,
  queryOrderSchema,
  queryPageSchema,
  queryPerPageSchema,
  querySearchSchema,
} from '@/domain/schemas/query';

export const getPatientsQuerySchema = z.object({
  search: querySearchSchema.optional(),
  status: z.enum(USER_STATUSES).optional(),
  orderBy: z.enum(PATIENTS_ORDER_BY).optional().default('name'),
  order: queryOrderSchema.default('ASC'),
  startDate: queryDateSchema.optional(),
  endDate: queryDateSchema.optional(),
  page: queryPageSchema,
  perPage: queryPerPageSchema,
});
```

Available query field schemas: `querySearchSchema`, `queryOrderSchema`, `queryDateSchema`, `queryPageSchema`, `queryPerPageSchema`, `queryPeriodSchema` (from `src/domain/schemas/query.ts`).

### Use-case ownership checks

Ownership is now covered in [Auth & permissions](#auth--permissions) — see `can()` documentation above.

### Dynamic filtering

Build `where` incrementally with `FindOptionsWhere`, `Between`, `ILike`:

```ts
const where: FindOptionsWhere<User> = {};
if (role) where.role = role;
if (status) where.status = status;
if (search) where.name = ILike(`%${search}%`);
if (startDate && endDate) where.createdAt = Between(startDate, endDate);
```

### Entity conventions

- Extend `BaseEntity` — provides `id` (UUID v7), `createdAt`, `updatedAt`
- Implement the matching Zod schema type
- Always `select` specific fields in queries, avoid over-fetching
- Explicit `relations: { entity: true }`
- When querying `Survey`, **never** include `{ user: true }` in relations — this would leak identifiable data

### Transactions

```ts
await this.dataSource.transaction(async (manager) => {
  const usersRepository = manager.getRepository(User);
  const surveysRepository = manager.getRepository(Survey);

  const patient = usersRepository.create({ role: 'patient', ... });
  await usersRepository.save(patient);

  const survey = surveysRepository.create({ user: patient, ... });
  await surveysRepository.save(survey);
});
```

## Code reuse

Check existing utilities in `src/utils/` (cookies, date ranges, file names, validators, formatters, normalize strings, email templates) and `src/constants/` (mime types, regex) before creating new ones.

## Important constraints

- **`patients` module**: queries `User` entity with `role: "patient"`
- **Ignore tests** — broken and pending refactor; instructions will be added later
- **Do NOT add comments** to code unless explicitly asked
- Files: `kebab-case`, exports match file names (`create-appointment.use-case.ts` → `CreateAppointmentUseCase`)
- `.npmrc` has `save-exact=true` — no `^` ranges

## Pre-commit pipeline

`husky pre-commit` → `lint-staged` → `prettier --check` + `eslint` on `*.{ts,js}`
`husky commit-msg` → `commitlint` (conventional commits only)
