# ABNMO Backend — Agent Guide

NestJS + TypeORM + MySQL + Zod API.

## Quick commands

| Command                                    | What it does                                             |
| ------------------------------------------ | -------------------------------------------------------- |
| `npm run dev`                              | Docker up → wait for DB → migrate → `nest start --watch` |
| `npm run test:prepare && npm run test:e2e` | Full E2E run                                             |
| `npm run lint:eslint:check`                | ESLint **+** `tsc --noEmit` (both in one command)        |
| `npm run lint:prettier:check`              | Prettier check only                                      |
| `npm run lint:prettier:fix`                | Prettier fix only                                        |

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

## Auth

- **JWT in HTTP-only signed cookies** (no `Authorization` header)
- Global guards: `AuthGuard` + `RolesGuard` + `FeatureGuard` (all registered in `AuthModule`)
- Decorators: `@Public()`, `@Roles(['all'])`, `@Roles(['admin', 'patient'])`, `@User()`, `@Cookies('name')`
- `admin` role **always** bypasses `RolesGuard` regardless of `@Roles()`
- User roles (from `USER_ROLES`): `admin`, `member`, `specialist`, `patient`

## Response conventions

- Portuguese (pt-BR) user messages, English log messages
- Format: `{ success: boolean, message: string, data?: ... }`

### Response validation

- All controller methods **must** use `@ZodResponse({ type: ResponseDto, status: N })` from `nestjs-zod`
- Never use `@ApiResponse` directly — it lacks runtime serialization and does not prevent data leakage
- `@ZodResponse` validates the response body against the DTO schema via the global `ZodSerializerInterceptor`
- Every `@ZodResponse` **must** include an explicit `status` code:

| HTTP  | When                                                                                                                         |
| ----- | ---------------------------------------------------------------------------------------------------------------------------- |
| `200` | Endpoint that returns resource data (GET list/detail, action that returns data)                                              |
| `201` | POST that creates a resource (`register/user`, `create-appointment`, `create-referral`, etc.)                                |
| `204` | PUT / PATCH / DELETE that modifies or removes a resource without returning data (`update`, `deactivate`, `cancel`, `logout`) |

- Do **not** inject `@Res()` response objects manually — use NestJS return values + HTTP exceptions
- **Exception**: `GET /status` uses `@ApiResponse` + `@Res()` (not `@ZodResponse`) because it needs dynamic HTTP status — 200 when OK, 503 when services are down; it validates the response manually via `getStatusResponseSchema.parse()`

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

### Use-case ownership checks

Use `can()` from `@/common/authorization/can`:

```ts
import { can } from '@/common/authorization/can';

// Automatically handles: admin bypass, feature check, self vs others
can(user, 'update:user', targetId);
```

The third argument (`compareToId`) triggers the ownership comparison — omitting it skips ID checks.

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
