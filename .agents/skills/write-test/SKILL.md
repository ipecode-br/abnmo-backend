---
name: write-test
description: Use this skill whenever the user asks to write, add, generate, or scaffold tests for this codebase — NestJS e2e/integration tests for HTTP endpoints AND unit tests for use cases. Trigger on requests like "write tests for X endpoint", "add e2e tests for the Y controller", "test the update user route", "add unit tests for the Z use case", or "cover this feature with tests". Encodes this team's exact conventions for feature/permission checks, describe/it naming, helper usage vs. direct API calls, repository mocking, factory usage, and which response fields must be asserted.
---

# write-test

Generates e2e and unit tests that match this codebase's established conventions exactly. Always look at neighboring test files in the target repo first to confirm helper names, DTO import paths, factory names, and exact Portuguese message strings — real code is the source of truth.

## Before writing anything

1. Identify the resource under test and locate its route/controller file, use case files, DTOs, entity, and any existing `*.e2e-spec.ts` or `*.spec.ts` in the repo.
2. For e2e tests, identify every endpoint to cover and whether it is **public** (`@Public()`) or **non-public** (requires cookies + feature).
3. For each non-public endpoint, identify the specific feature flag(s) it requires (e.g. `'read:user:others'`, `'update:user'`) and whether there's "others" distinction.
4. For unit tests, identify every use-case dependency to mock (repositories via `getRepositoryToken`, other use cases, services like `LogService`/`MailService`).
5. If anything is ambiguous, ask the user rather than guessing feature names or message strings.

---

## E2E test conventions

These apply to every `*.e2e-spec.ts` file:

### Non-negotiable rules

- **Every non-public endpoint gets at least one successful request test** using a user with the exact required feature(s). Never test only the failure path.
- **Every non-public endpoint gets at least one 403 blocked-request test** for a user missing the required feature. Assert all three: `res.status` (403), `res.body.success` (false), and `res.body.message` (`'Você não tem permissão para executar esta ação.'`).
- **User creation for auth depends on test intent:**
  - Testing feature/permission gating itself → use `createMember({ features: [...], login: true })`.
  - Testing anything else (404s, business-logic edge cases, pagination, filters) → use `createAdmin({ login: true })`.
- **Use repo helpers to create/read database state** (`createUser`, `getUserById`, `createSurveySubmission`, `createWebhookEvent`, etc.) instead of calling the API to set up fixtures — **except** when the endpoint under test _is_ the creation/read endpoint itself.
- **Assert `status`, `success`, and `message` on every response** — error and success alike. For success responses with `data`, also assert the relevant data fields, and confirm mutations by re-fetching via a helper rather than trusting the response body alone.
- **Side effects (emails)** use `jest.spyOn(app.get(MailService), 'send')`, checking `to`, `subject`, and `html` content. Always `mockRestore()` after.
- **Sensitive fields** must be checked for absence when the endpoint omits them: `expect(res.body).not.toHaveProperty('surveyToken')`.

### Public endpoints

Public endpoints use `@Public()` and bypass `AuthGuard`. They may use alternative auth (e.g. HMAC header, dashboard key):

- **HMAC/webhook endpoints**: test 401 for missing header and 401 for invalid signature, using exact Portuguese error messages from the middleware.
- **Dashboard-key endpoints**: set `headers = { 'x-dashboard-key': app.get(EnvService).get('DASHBOARD_KEY') }` in `beforeAll`. Test 400 validation errors (missing/invalid fields) with the generic message `'Os dados enviados são inválidos.'`.

### Structure

```ts
import { INestApplication } from '@nestjs/common';

import type {} from /* DTOs */ '@/app/http/<resource>/<resource>.dtos';
// other imports as needed (MailService, EnvService)

import {
  ApiClient,
  BaseResponseBody,
  createApiClient,
} from '../config/api-client';
import { createAdmin, createMember, createPatient } from '../config/helpers';
import { getTestApp } from '../config/setup-e2e';
import {} from /* resource helpers */ '../helpers/<resource>';

describe('<Resource> (e2e)', () => {
  let app: INestApplication;
  let api: ApiClient;

  beforeAll(() => {
    app = getTestApp();
    api = createApiClient(app);
  });

  describe('<METHOD> <path>', () => {
    it('<happy path description>', async () => {
      /* ... */
    });
    it('returns 404 for non-existent ID', async () => {
      /* ... */
    }); // if :id route
    it('blocks user without "<feature>" feature', async () => {
      /* ... */
    });
    // business-rule edge cases
  });
});
```

### Naming conventions for `it(...)` blocks

- `'paginates users properly'`
- `'returns user by ID'`
- `'returns webhook event details'`
- `'blocks user without "read:user:others" feature'`
- `'returns 404 for non-existent ID'`
- `'returns 401 when content-hmac header is missing'`
- `'returns 200 when survey is not found'` (webhooks always return 200)
- `'cannot deactivate an inactive user'`
- Group by HTTP verb + path: `describe('PATCH /users/:id/deactivate', ...)`.
- Quote feature-flag names exactly as they appear in code (`"read:user:others"`).

### Common E2E patterns

**Pagination test** — create N records via helper, request page 1 and page 2, assert lengths and `total` on both pages.

**Feature-block test** (403) — `createMember({ login: true })` (no `features` or with insufficient features), call the endpoint, assert 403 + `success: false` + exact Portuguese message.

**Self vs. others** — when an endpoint distinguishes acting on your own record vs. another's (e.g. `PUT /users/:id`), write four tests: updates own data (feature X), updates another's data (feature `X:others`), blocked without X on own data, blocked without `X:others` on another's data.

**State-transition guard** — for activate/deactivate/approve/decline actions, add a test hitting the action when the resource is already in the target state, expecting 409 (ConflictException) or 400 with the specific message.

**404 test** — always use an admin (full access) and the canonical non-existent UUID `00000000-0000-0000-0000-000000000000`, asserting the resource-specific Portuguese not-found message.

**Validation test** — for creation endpoints, cover missing required fields and invalid enum/size values with 400 + `'Os dados enviados são inválidos.'`.

### Reference E2E files

Study these for exact patterns, spacing, and ordering:

- `tests/e2e/users.e2e-spec.ts` — pagination, self/others, feature-gated PATCH, state-transition guards (409), invite CRUD
- `tests/e2e/surveys-submissions.e2e-spec.ts` — public creation (dashboard-key), validation, filters, email spy with `jest.spyOn`
- `tests/e2e/webhooks.e2e-spec.ts` — public POST with HMAC auth, 401 on missing/invalid HMAC, GET :id with feature guard

---

## Unit test conventions

Unit tests live under `tests/unit/` and test use cases (and occasionally guards, utils, middlewares) in isolation with mocked dependencies. Use the config `tests/config/jest-unit.json` (parallel, no DB).

### Structure

```ts
import { ForbiddenException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';
import { requestUserFactory } from 'tests/config/factories/shared.factory';
import {} from /* entity-specific factories */ 'tests/config/factories/<entity>.factory';
import { Repository } from 'typeorm';

import { SomeUseCase } from '@/app/http/<module>/use-cases/<use-case>.use-case';
import { SomeEntity } from '@/domain/entities/<entity>';

describe('<UseCaseName>', () => {
  let useCase: SomeUseCase;
  let repo: MockProxy<Repository<SomeEntity>>;
  // other mocked dependencies...

  beforeEach(async () => {
    repo = mock<Repository<SomeEntity>>();
    // otherService = mock<OtherService>();

    const module = await Test.createTestingModule({
      providers: [
        SomeUseCase,
        { provide: getRepositoryToken(SomeEntity), useValue: repo },
        // { provide: OtherService, useValue: otherService },
        // { provide: LogService, useValue: { log: jest.fn() } },
      ],
    }).compile();

    useCase = module.get(SomeUseCase);
  });

  it('returns entity for admin', async () => {
    /* ... */
  });
  it('returns entity with "<feature>" feature', async () => {
    /* ... */
  });
  it('throws "ForbiddenException" without matching features', async () => {
    /* ... */
  });
  it('throws "NotFoundException" when entity does not exist', async () => {
    /* ... */
  });
});
```

### Mocking dependencies

**Repositories** — use `mock<Repository<T>>()` from `jest-mock-extended` and provide via `getRepositoryToken(T)`:

```ts
import { getRepositoryToken } from '@nestjs/typeorm';
import { mock, MockProxy } from 'jest-mock-extended';

let repo: MockProxy<Repository<SomeEntity>>;
repo = mock<Repository<SomeEntity>>();

// In module setup:
{ provide: getRepositoryToken(SomeEntity), useValue: repo }
```

Mock common repository methods:

- `repo.findOne.mockResolvedValue(entity)` — entity found
- `repo.findOne.mockResolvedValue(null)` — not found
- `repo.create.mockImplementation((data) => ({ ...data }))` — pass-through
- `repo.save.mockResolvedValue(entity)` — successful save
- `repo.update.mockResolvedValue(undefined)` — successful update

**Other use cases / services** — mock with `mock<Service>()` and provide directly:

```ts
let otherUseCase: MockProxy<OtherUseCase>;
otherUseCase = mock<OtherUseCase>();

// In module setup:
{ provide: OtherUseCase, useValue: otherUseCase }
```

**LogService** — mock minimally since it's not asserted:

```ts
{ provide: LogService, useValue: { log: jest.fn() } }
```

**DataSource (for transactions)** — when a use case uses `dataSource.transaction`, mock it:

```ts
import { getDataSourceToken } from '@nestjs/typeorm';
let dataSource: MockProxy<DataSource>;

dataSource = mock<DataSource>();
dataSource.transaction.mockImplementation(async (cb: any) => {
  return cb(manager);
});
```

For transactions that use `manager.getRepository()`:

```ts
const makeTxRepo = () => {
  const repo = mock<Repository<any>>();
  repo.create.mockImplementation((data: any) => ({ ...data }));
  repo.save.mockImplementation((data: any) => Promise.resolve(data));
  return repo;
};
```

### Factories for unit tests

Factories live under `tests/config/factories/` and generate entity objects with random/fake data:

| Factory                           | Path                                              | Usage                                     |
| --------------------------------- | ------------------------------------------------- | ----------------------------------------- |
| `requestUserFactory(overrides?)`  | `tests/config/factories/shared.factory.ts`        | Mock `RequestUser` for auth/feature tests |
| `userFactory(overrides?)`         | `tests/config/factories/user.factory.ts`          | Generate `User` entities                  |
| `surveyFactory(overrides?)`       | `tests/config/factories/survey.factory.ts`        | Generate `Survey` entities                |
| `webhookEventFactory(overrides?)` | `tests/config/factories/webhook-event.factory.ts` | Generate `WebhookEvent` entities          |

**Creating new factories**: follow the pattern — import `{ faker }` from `@faker-js/faker`, export a function that returns an object matching the entity shape with sensible defaults, allowing `Partial<T>` overrides:

```ts
import { faker } from '@faker-js/faker';
import { SomeEntity } from '@/domain/entities/some-entity';
import { baseEntityFactory } from './shared.factory';

export function someEntityFactory(
  overrides: Partial<SomeEntity> = {},
): SomeEntity {
  return {
    ...baseEntityFactory(),
    field: faker.helpers.arrayElement(SOME_ENUM),
    ...overrides,
  } as SomeEntity;
}
```

### Assertions for unit tests

**Authorization fails before DB access** — assert repo not called:

```ts
expect(repo.findOne).not.toHaveBeenCalled();
```

**Exception expectations** — three patterns:

```ts
// Exception is thrown and propagated
await expect(useCase.execute(input)).rejects.toThrow(NotFoundException);
await expect(useCase.execute(input)).rejects.toThrow(ForbiddenException);

// Exception is caught silently (e.g., webhooks that must not throw)
await expect(useCase.execute(input)).resolves.toBeUndefined();
```

**Repo calls verified with exact args**:

```ts
expect(repo.findOne).toHaveBeenCalledWith(
  expect.objectContaining({ where: { id: 'entity-id' } }),
);
```

**Return value shape** — assert the mapped plain object matches the response schema:

```ts
expect(result).toEqual({
  id: entity.id,
  event: entity.event,
  // only fields from the response schema
});
```

### Unit test naming

- `'returns <resource> for admin'`
- `'returns <resource> with "<feature>" feature'`
- `'throws "ForbiddenException" without "<features(s)>" feature(s)'`
- `'throws "NotFoundException" when <resource> does not exist'`
- `'bypasses when metadata key does not match'`
- `'catches "NotFoundException" and marks webhook event as failed'`
- Quote exception class names in descriptions when asserting a specific exception type.

### Mandatory unit test cases

Every use case that queries or mutates data should cover:

1. **Happy path with admin** — admin bypasses `can()`, full access
2. **Happy path with feature** — non-admin with the correct feature
3. **ForbiddenException** — user without the required feature (assert repo NOT called)
4. **NotFoundException** — entity missing (use admin to isolate the not-found path)
5. **Business rules** — state guards, duplicates, validation specific to the use case

### Reference unit test files

- `tests/unit/use-cases/webhooks/get-webhook-event.use-case.spec.ts` — minimal example: single repo, admin + feature + forbidden + not-found
- `tests/unit/use-cases/webhooks/survey-signature-webhook.use-case.spec.ts` — multi-dependency, `makePayload` factory, `resolves.toBeUndefined()` for caught errors
- `tests/unit/use-cases/auth/create-user.use-case.spec.ts` — multi-repo, token verification, exceptions with specific types
- `tests/unit/use-cases/surveys/create-survey.use-case.spec.ts` — datasource transaction, `makeTxRepo`, signature use case mock

---

## E2E helpers reference

| Helper                                           | Import path                         | Purpose                        |
| ------------------------------------------------ | ----------------------------------- | ------------------------------ |
| `createAdmin({ login: true })`                   | `tests/config/helpers`              | Full-access user + cookies     |
| `createMember({ features: [...], login: true })` | `tests/config/helpers`              | Feature-scoped user + cookies  |
| `createPatient({ login?: true })`                | `tests/config/helpers`              | Patient user for test setup    |
| `createSpecialist({ login?: true })`             | `tests/config/helpers`              | Specialist user for test setup |
| `createUser(overrides?)`                         | `tests/helpers/users`               | Create user directly in DB     |
| `getUserById(id)`                                | `tests/helpers/users`               | Fetch user by ID               |
| `createSurvey({ patient, ...ovrr })`             | `tests/helpers/surveys`             | Create survey in DB            |
| `getSurveyById(id)`                              | `tests/helpers/surveys`             | Fetch survey by ID             |
| `createSurveySubmission({ patient, ...ovrr })`   | `tests/helpers/surveys-submissions` | Create submission in DB        |
| `getSurveySubmissionById(id)`                    | `tests/helpers/surveys-submissions` | Fetch submission by ID         |
| `createWebhookEvent(overrides?)`                 | `tests/helpers/webhooks`            | Create webhook event in DB     |
| `createUserInvite(overrides?)`                   | `tests/helpers/invites`             | Create invite in DB            |
| `getUserInvites({ email })`                      | `tests/helpers/invites`             | Fetch invites by email         |
| `createDocument({ user, submission })`           | `tests/helpers/documents`           | Create document for submission |

Always check `tests/helpers/` for the latest helpers before creating new ones — the pattern is to re-use existing helpers whenever possible.

---

## After writing — checklist

### E2E checklist

- [ ] One `describe` per route, named `'<METHOD> <path>'`
- [ ] Non-public routes: ≥1 success test with correct feature(s) + ≥1 403 blocked test (status/success/message)
- [ ] 401 test for endpoints requiring auth (missing/invalid credentials)
- [ ] Public routes: 401/validation tests appropriate to the auth mechanism (HMAC, dashboard key)
- [ ] Member used only for feature/permission tests; admin used everywhere else
- [ ] DB setup via helpers, not the API, unless endpoint under test is the creation endpoint
- [ ] 404 test present for any `:id` route, with resource-specific Portuguese message
- [ ] State-transition/business-rule guards covered where applicable
- [ ] Success responses assert `success` (true), `message`, and `status`
- [ ] Error responses assert all three: `status`, `success` (false), `message` (exact)
- [ ] No invented message strings, feature names, or status codes

### Unit test checklist

- [ ] Deps mocked with `mock<T>()` from `jest-mock-extended`
- [ ] Repos provided via `getRepositoryToken(Entity)`, services/use cases provided directly
- [ ] `LogService` mocked as `{ log: jest.fn() }`
- [ ] Admin happy path + feature happy path + ForbiddenException + NotFoundException
- [ ] `expect(repo.findOne).not.toHaveBeenCalled()` when auth fails before DB
- [ ] Entity values come from factories, not hardcoded magic strings
- [ ] Response shape matches the Zod schema fields exactly (no extra fields from `BaseEntity`)
- [ ] `describe('<UseCaseName>')` — not the file path
