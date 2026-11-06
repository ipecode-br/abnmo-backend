# ABNMO Backend — Agent Guide

NestJS + TypeORM + PostgreSQL + Zod API (Node.js >= 22).

## Quick commands

| Command                                    | What it does                                       |
| ------------------------------------------ | -------------------------------------------------- |
| `npm run dev`                              | Docker up → queues → wait for DB → migrate → watch |
| `npm run validate`                         | Prettier check + ESLint + `tsc --noEmit`           |
| `npm run lint:prettier:fix`                | Fix formatting                                     |
| `npm run test`                             | Prepare DB → unit tests → e2e tests                |
| `npm run test:unit`                        | Unit tests only (parallel, no DB)                  |
| `npm run test:prepare && npm run test:e2e` | Full E2E run                                       |
| `npm run db:generate`                      | Generate a migration                               |
| `npm run db:migrate`                       | Run pending migrations                             |

Before committing: `npm run lint:prettier:fix && npm run validate`.

## Deep reference

Read only when the task needs the detail:

- `docs/index.md` — architecture, domain, controllers, DTOs, use-cases, responses, errors, logging, auth, permissions
- `docs/workers.md` — SQS/Lambda workers, envelope, idempotency, adding a worker
- `.agents/skills/write-test/SKILL.md` — e2e and unit test conventions (or load the `write-test` skill)
- `README.md` — local setup, workers, seeding

## Architecture

- **Entrypoints**: `src/app/main.ts` (HTTP, local dev), `src/app/lambda.ts` (AWS Lambda), `src/instrument.ts` (Sentry init), `src/workers/{name}/handler.ts` (SQS consumers)
- **Feature modules**: `src/app/http/{feature}/` — `{feature}.module.ts`, `.controller.ts`, `.dtos.ts`, `use-cases/{action}-{feature}.use-case.ts`
- **Entities**: `src/domain/entities/`, registered centrally in `DATABASE_ENTITIES` (`src/domain/entities/database.ts`)
- **Zod schemas** (source of truth for validation): `src/domain/schemas/{entity}/` — `index.ts`, `requests.ts`, `responses.ts`
- **Enums**: `as const` arrays in `src/domain/enums/`, **not** the TypeScript `enum` keyword
- **Path alias**: `@/` → `./src/`

### Workers

SQS consumer Lambdas use the shared `createQueueWorkerHandler` builder (`src/shared/queue/create-handler.ts`), which handles envelope parsing, idempotency, error classification, logging, and Sentry reporting. Worker-specific code lives in `src/workers/{name}/`. See `docs/workers.md` for the full guide.

## Patient data model

- **No dedicated `Patient` entity** — patients are `User` records with `role: 'patient'`
- **Sensitive/identifiable data** (name, phone, CPF, email, SUS ID) → `User` entity
- **Anonymous demographic & clinical data** (birthday, gender, race, address, diagnosis, etc.) → `Survey` entity
- `User` has a `@OneToOne` relation to `Survey` for survey data
- **Never** join `User` in statistics queries — query `Survey` only
- **Statistics must never return sensitive or linkable data** — only aggregate counts, percentages, etc.

## Auth & permissions

- JWT tokens in HTTP-only signed cookies — no `Authorization` header
- Request auth guards, in order: `AuthGuard` → `FeatureGuard` (registered in `AuthModule`)
- **Admin** bypasses `can()` (returns `true` unconditionally)
- User roles (from `USER_ROLES`): `admin`, `member`, `specialist`, `patient`

### Decorators

| Decorator            | Purpose                                   |
| -------------------- | ----------------------------------------- |
| `@Public()`          | Skip `AuthGuard`                          |
| `@RequireFeature(X)` | Require feature(s) — see below            |
| `@User()`            | Injects `RequestUser` from cookie session |
| `@Cookies('name')`   | Injects raw cookie value                  |

### `@RequireFeature` decorator

Accepts a single `UserFeature` or `UserFeature[]` (OR logic). If the user has **any** of the listed features, the guard passes — it never checks ownership.

**Every endpoint that is not `@Public()` must have a `@RequireFeature()` decorator.** Endpoints without any feature are denied by default.

```ts
@RequireFeature('create:appointment')
@RequireFeature(['read:survey', 'read:survey:others'])  // OR: either feature grants access
```

Ownership is enforced separately in use cases via `can()`.

### `can()` — use-case level authorization

Imports from `@/common/authorization/can`. Use inside use cases to check both feature ownership and resource ownership:

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
```

`compareToId` accepts `string | string[]` (passes when the user matches at least one ID). Features ending with `:others` bypass ownership entirely. `undefined` `compareToId` skips ownership checks. `can()` throws `ForbiddenException` on failure.

## Response conventions

- Portuguese (pt-BR) user messages, English log messages
- Body format: `{ success: boolean, message: string, data?: ... }`
- Every controller method **must** use `@ZodResponse({ type, status })` from `nestjs-zod`: `200` for reads/actions returning data, `201` for POSTs that create a resource
- Never use `@ApiResponse` directly — it lacks runtime serialization and does not prevent data leakage. The only exception is `GET /status`, which needs dynamic 200/503 and validates manually via `getStatusResponseSchema.parse()`
- The global `ZodSerializerInterceptor` validates responses with `.strict()`. **Never return TypeORM entities or full relation objects** — map to plain objects containing exactly the response-schema fields. See `docs/responses.md`

## Database

- `synchronize: false` — migrations only, in `infra/database/migrations/`
- **Migration file naming**: kebab-case only, e.g. `add-x-column-to-users.ts` — never CamelCase like `AddXColumnToUsers`
- **Migration schema-agnosticism**: when generating migrations (against `public`), remove any `"public"."` qualifiers from CREATE/DROP TYPE, DROP INDEX, and enum column references so the same migration runs in both `public` (dev) and `test` (test) schemas via `search_path`
- `SnakeNamingStrategy` converts columns to snake_case automatically
- Inject `Repository<T>` directly in use-cases (no repository layer). Inject `DataSource` for multi-table transactions
- Always use `.create()` then `.save()` (two steps), never `repository.save()` directly

## Logging & Sentry

- `LogModule` is global — never import it
- `@Log('event_name')` on controller methods registers auditable events; `@Log()` (class decorator) + `constructor(private readonly logger: LogService)` on use-cases
- All database writes (create, update, delete) **must** log after successful execution
- Throw HTTP exceptions with a `cause` property set to the original error; the exception message goes to the user and the cause is logged by the exception filter
- `LogService` forwards to Sentry when `SENTRY_DSN` is set, subject to `SENTRY_LOGS` (`none`/`error`/`all`). Logs with HTTP status < 500 are filtered by `beforeSendLog`
- Sentry **issues** come from `Sentry.captureException()`, not `LogService.error()`. The HTTP filter captures 5xx and `ZodSerializationException` automatically; call `captureException()` manually only in background/non-HTTP paths that swallow errors. See `docs/logging.md`

## Testing

- Unit: `tests/**/*.spec.ts`, mocked repositories, no DB
- E2E: `tests/e2e/**/*.e2e-spec.ts`, real PostgreSQL in an isolated `test` schema (`search_path`), run serially
- `test:prepare` creates and migrates the test schema; `test:reset` recreates it after schema drift
- Global e2e setup creates the Nest app once and truncates every table before each test (`tests/config/setup-e2e.ts`)
- Use helpers/factories from `tests/config/` and `tests/helpers/` instead of calling the API to set up fixtures
- Full conventions (feature/403 coverage, naming, mocks, assertions): load the `write-test` skill

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

### Path params

For UUID route params (`:id`), use the shared `UUIDParam` DTO with `@Param()` destructuring:

```ts
import { UUIDParam } from '@/common/dtos';

@Get(':id')
async getById(@Param() { id }: UUIDParam, @User() user: RequestUser) {
  // id is a validated UUID v7 string
}
```

**Never** use `@Param('id') id: string` for UUIDs — it bypasses validation and allows invalid strings to reach the database.

### Schema reuse

Prefer `.pick()`, `.extend()`, or `.merge()` from existing schemas before defining raw fields. Only create a new schema from scratch if no existing one covers the domain. Use shared schemas (`nameSchema`, `emailSchema`, `phoneSchema`, etc.) from `src/domain/schemas/shared.ts` instead of raw `z.string()`.

When composing a list response, extract a standalone list-item schema, export its inferred type, then use it in the response schema's array. This keeps the Zod type available for use-case return types and keeps runtime validation aligned.

### Query schemas

Build query schemas with `z.object(...)` using the field schemas from `src/domain/schemas/query.ts`:

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

Available field schemas: `querySearchSchema`, `queryOrderSchema`, `queryDateSchema`, `queryPageSchema`, `queryPerPageSchema`, `queryPeriodSchema`.

### Shared modules

| Module               | When to import        |
| -------------------- | --------------------- |
| `CryptographyModule` | Hashing, JWT, cookies |
| `StorageModule`      | File uploads          |
| `SignatureModule`    | Digital signatures    |

`QueueModule`, `LogModule`, and `EnvModule` are global — no need to import them.

### Exception mapping

| Exception                     | HTTP | When                           |
| ----------------------------- | ---- | ------------------------------ |
| `NotFoundException`           | 404  | Entity not found by ID         |
| `UnauthorizedException`       | 401  | Bad credentials, expired token |
| `ForbiddenException`          | 403  | Permission/ownership violation |
| `BadRequestException`         | 400  | Business rule violation        |
| `ConflictException`           | 409  | Duplicate email, CPF, etc.     |
| `ServiceUnavailableException` | 503  | External service (email, S3)   |

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

Check existing utilities in `src/utils/` (cookies, date ranges, file names, validators, formatters, normalize strings, anonymize) and `src/constants/` before creating new ones.

## Important constraints

- **`patients` module**: queries `User` entity with `role: "patient"`
- **Do NOT add comments** to code unless explicitly asked
- Files: `kebab-case`, exports match file names (`create-appointment.use-case.ts` → `CreateAppointmentUseCase`)
- `.npmrc` has `save-exact=true` — no `^` ranges

## Pre-commit pipeline

`husky pre-commit` → `lint-staged` → `prettier --check` + `eslint` on `*.{ts,js}`; `husky commit-msg` → `commitlint` (conventional commits only).
