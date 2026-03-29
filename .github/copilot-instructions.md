# Copilot Instructions for ABNMO Platform

NestJS SaaS API managing patients, referrals, appointments, and health tracking. Uses TypeORM with MySQL and Zod schemas for validation.

## Architecture: MVC + Use Cases

**Stack**: NestJS + TypeORM + MySQL + Zod + JWT (HTTP-only cookies)

Module structure (`/src/app/http/{featureName}`):

```
{feature}/
├── {feature}.module.ts       # Module definition with imports/providers
├── {feature}.controller.ts   # Routes and request handling
├── {feature}.dtos.ts         # DTOs created from Zod schemas
└── use-cases/
    └── {action}-{feature}.use-case.ts  # One file per operation
```

## Module Organization

### 1. Module File (`*.module.ts`)

Register entities, inject TypeORM repositories, and declare use-case providers:

```typescript
@Module({
  imports: [TypeOrmModule.forFeature([Appointment, Patient, User])],
  controllers: [AppointmentsController],
  providers: [
    GetAppointmentsUseCase,
    CreateAppointmentUseCase,
    UpdateAppointmentUseCase,
    CancelAppointmentUseCase,
  ],
})
export class AppointmentsModule {}
```

Each module is self-contained — no cross-module feature dependencies. To access another domain's entities, register them in `TypeOrmModule.forFeature([...])` of the current module.

**Shared modules** — import explicitly only where needed:

| Module | When to import |
|---|---|
| `CryptographyModule` | Creating/verifying hashes, JWT tokens, cookie handling |
| `MailModule` | Sending emails |
| `EnvModule` | Accessing environment variables |

> `LogModule` is global — never import it.

### 2. DTOs File (`*.dtos.ts`)

Create DTOs exclusively from Zod schemas in `/domain/schemas`. Use `createZodDto()`:

```typescript
import { createZodDto } from 'nestjs-zod';
import {
  createAppointmentSchema,
  updateAppointmentSchema,
  getAppointmentsQuerySchema,
} from '@/domain/schemas/appointments/requests';
import { getAppointmentsResponseSchema } from '@/domain/schemas/appointments/responses';

export class GetAppointmentsQuery extends createZodDto(getAppointmentsQuerySchema) {}
export class GetAppointmentsResponse extends createZodDto(getAppointmentsResponseSchema) {}
export class CreateAppointmentDto extends createZodDto(createAppointmentSchema) {}
export class UpdateAppointmentDto extends createZodDto(updateAppointmentSchema) {}
```

One file per feature. Never define fields manually — all validation comes from the Zod schema.

**Naming**: `{Action}{Entity}Dto` / `Get{Entities}Query` / `Get{Entities}Response`

### 3. Controller File (`*.controller.ts`)

Controllers receive requests, delegate to use-cases, and return formatted responses. No business logic here.

```typescript
@ApiTags('Atendimentos')
@Roles(['manager', 'nurse', 'specialist'])
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly getAppointmentsUseCase: GetAppointmentsUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
  ) {}

  @Get()
  @Roles(['all'])
  async getAppointments(
    @Query() query: GetAppointmentsQuery,
    @User() user: AuthUser,
  ): Promise<GetAppointmentsResponse> {
    const data = await this.getAppointmentsUseCase.execute({ user, ...query });
    return { success: true, message: 'Lista de atendimentos retornada com sucesso.', data };
  }

  @Post()
  async create(
    @User() user: AuthUser,
    @Body() dto: CreateAppointmentDto,
  ): Promise<BaseResponse> {
    await this.createAppointmentUseCase.execute({ user, ...dto });
    return { success: true, message: 'Atendimento cadastrado com sucesso.' };
  }

  @Patch(':id/cancel')
  @Roles(['manager', 'nurse'])
  async cancel(
    @Param('id') id: string,
    @User() user: AuthUser,
  ): Promise<BaseResponse> {
    await this.cancelAppointmentUseCase.execute({ id, user });
    return { success: true, message: 'Atendimento cancelado com sucesso.' };
  }
}
```

### 4. Use-Case Files (`use-cases/*.use-case.ts`)

One use-case per file, one responsibility. Apply `@Logger()` before `@Injectable()` when using `AppLogger`:

```typescript
interface CreateAppointmentUseCaseInput {
  user: AuthUser;
  patientId: string;
  date: Date;
  annotation: string | null;
}

@Logger()
@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
    this.logger.setEvent('create_appointment');

    const patient = await this.patientsRepository.findOne({
      where: { id: input.patientId },
      select: { id: true },
    });

    if (!patient) {
      throw new NotFoundException('Paciente não encontrado.');
    }

    const appointment = await this.appointmentsRepository.save({
      ...input,
      status: 'scheduled',
      createdBy: input.user.id,
    });

    this.logger.log('Appointment created successfully', {
      patientId: input.patientId,
      appointmentId: appointment.id,
      createdBy: input.user.id,
    });
  }
}
```

**Naming**: `{Action}{Entity}UseCase` (e.g., `CreateAppointmentUseCase`, `GetAppointmentsUseCase`)

## Domain Layer

### Entities (`/domain/entities/`)

TypeORM entities implement the corresponding Zod schema. Always use UUID primary keys:

```typescript
@Entity('appointments')
export class Appointment implements AppointmentSchema {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column('uuid')
  patientId: string;

  @Column({ type: 'enum', enum: APPOINTMENT_STATUSES, default: 'scheduled' })
  status: AppointmentStatus;

  @Column({ type: 'varchar', nullable: true })
  annotation: string | null;

  @CreateDateColumn({ type: 'datetime' })
  createdAt: Date;

  @ManyToOne(() => Patient, (patient) => patient.appointments)
  patient: Patient;
}
```

### Enums (`/domain/enums/`)

Use `as const` arrays with derived types — no TypeScript `enum` keyword:

```typescript
export const APPOINTMENT_STATUSES = ['scheduled', 'canceled', 'completed', 'no_show'] as const;
export type AppointmentStatus = (typeof APPOINTMENT_STATUSES)[number];
```

### Schemas (`/domain/schemas/`)

Schemas are the source of truth for validation. DTOs derive directly from schemas, never written manually:

```
domain/schemas/
├── base.ts            # baseResponseSchema
├── query.ts           # baseQuerySchema
├── shared.ts          # shared primitives (name, email, phone...)
└── {feature}/
    ├── index.ts       # entity schema
    ├── requests.ts    # create/update/query schemas
    └── responses.ts   # response schemas
```

## Authentication & Authorization

Authentication uses **JWT stored in HTTP-only signed cookies** — no `Authorization` header. Two global guards apply to all routes: `AuthGuard` (authentication) and `RolesGuard` (authorization).

### Decorators

```typescript
@Roles(['manager', 'nurse'])      // restrict by role
@Roles(['all'])                   // any authenticated user
@Public()                         // skip all guards entirely
@User()                           // inject AuthUser from request
@Cookies('refresh_token')         // read a signed cookie
```

`admin` always bypasses `RolesGuard` regardless of `@Roles`.

### `AuthUser` type

```typescript
type AuthUser = {
  id: string;
  email: string;
  role: 'admin' | 'manager' | 'nurse' | 'specialist' | 'patient';
};
```

### Ownership checks in use-cases

Role-based data restrictions are enforced in use-cases, not in guards:

```typescript
if (user.role === 'patient') {
  where.patientId = user.id;
}

if (user.id !== targetId && user.role !== 'admin') {
  throw new ForbiddenException('Você não tem permissão para atualizar este usuário.');
}
```

## Responses

All responses include `success` and `message`. Operations returning data add `data`:

```typescript
// No data (create, update, cancel)
return { success: true, message: 'Atendimento cadastrado com sucesso.' };

// With data (list, detail)
return { success: true, message: 'Lista de atendimentos retornada com sucesso.', data };
```

Response messages are always in **Portuguese (pt-BR)**.

## Zod Schemas & Enums

Centralize validation and types in `/domain/schemas` and `/domain/enums`:

- **Schemas** (`/domain/schemas/{entity}/{type}.ts`): Define request/response validation
- **Enums** (`/domain/enums/{entity}.ts`): Define constants and types

DTOs inherit validation directly from schemas, no manual definition needed.

## Naming Conventions

Clear, explicit, human-readable names. Reduce cognitive load:

- **Variables/Functions**: `camelCase` (e.g., `getUserAppointments`, `createdAt`)
- **Classes/Types**: `PascalCase` (e.g., `CreateAppointmentDto`, `AppointmentStatus`)
- **Enums/Constants**: `SCREAMING_SNAKE_CASE` (e.g., `APPOINTMENT_STATUSES`, `MAX_RESULTS_LIMIT`)
- **Files**: `kebab-case` (e.g., `create-appointment.use-case.ts`, `appointments.dtos.ts`)

Files should match their exports: `get-total-patients.use-case.ts` exports `GetTotalPatientsUseCase`.

## Database Patterns

### Queries

- **Always select fields**: `select: { id: true, name: true }` — avoid over-fetching
- **Count operations**: Select only `id` for performance
- **Relations**: Destructure explicitly: `relations: { patient: true }`

```typescript
const appointments = await this.appointmentsRepository.find({
  select: { id: true, date: true, status: true },
  relations: { patient: true },
  where: { patientId: id },
});
```

### Repository Access

Inject TypeORM repositories directly into use-cases. No separate repository files:

```typescript
@Logger()
@Injectable()
export class CreateAppointmentUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly logger: AppLogger,
  ) {}
}
```

### Transactions

Use `DataSource` when saving to multiple tables atomically:

```typescript
constructor(
  @InjectDataSource()
  private readonly dataSource: DataSource,
) {}

await this.dataSource.transaction(async (manager) => {
  const patient = await manager.save(Patient, { ...patientData });
  await manager.save(PatientSupport, supports.map((s) => ({ ...s, patientId: patient.id })));
});
```

## Common Patterns

### Error Handling

Use NestJS exceptions with descriptive messages:

- **User-facing messages**: Portuguese (pt-BR) — displayed in the UI
- **Log messages**: English — for developers

```typescript
// Not found
throw new NotFoundException('Paciente não encontrado.');

// Conflict
throw new ConflictException('Já existe um paciente com este e-mail.');

// Business rule violation
throw new BadRequestException('A data de atendimento deve estar dentro dos próximos 3 meses.');

// Ownership
throw new ForbiddenException('Você não tem permissão para atualizar este usuário.');

// External service failure
throw new ServiceUnavailableException('Não foi possível enviar o e-mail de convite.');
```

| Exception | HTTP | When |
|---|---|---|
| `NotFoundException` | 404 | Entity not found by provided ID |
| `UnauthorizedException` | 401 | Invalid credentials, missing/expired token |
| `ForbiddenException` | 403 | Insufficient permission or ownership violation |
| `BadRequestException` | 400 | Business rule violation |
| `ConflictException` | 409 | Unique data conflict (email, CPF already registered) |
| `ServiceUnavailableException` | 503 | External service failure (email send, etc.) |

### Logging

Use `AppLogger` with the `@Logger()` class decorator. Apply `@Logger()` before `@Injectable()`:

```typescript
@Logger()
@Injectable()
export class CreateAppointmentUseCase {
  constructor(private readonly logger: AppLogger) {}

  async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
    this.logger.setEvent('create_appointment');  // always first line

    // on failure
    this.logger.error('Create appointment failed: patient not found', { patientId });
    throw new NotFoundException('Paciente não encontrado.');

    // on success
    this.logger.log('Appointment created successfully', { patientId, appointmentId });
  }
}
```

Rules:
- Call `this.logger.setEvent()` as the **first line** of every `execute()`.
- Log messages in **English**.
- Log errors before throwing exceptions that represent operational failures.
- Never log passwords, tokens, or sensitive data.

### Dynamic Filtering

Build `where` incrementally for dynamic queries:

```typescript
import { Between, ILike, type FindOptionsWhere } from 'typeorm';

const where: FindOptionsWhere<Appointment> = {};

if (user.role === 'patient') where.patientId = user.id;
if (search) where.professionalName = ILike(`%${search}%`);
if (startDate && endDate) where.date = Between(startDate, endDate);

const result = await this.appointmentsRepository.find({ where });
```

## E2E Tests

Tests live in `tests/e2e/`. Use the `api` client from `tests/config/api-client.ts`:

```typescript
import { INestApplication } from '@nestjs/common';
import { api } from '../config/api-client';
import { getTestApp } from '../config/setup';

describe('Appointments (e2e)', () => {
  let app: INestApplication;

  beforeAll(() => (app = getTestApp()));

  it('should list appointments', async () => {
    const nurseApi = await api(app).createNurseAndLogin();
    const response = await nurseApi.get('/appointments').send();

    expect(response.status).toBe(200);
    expect(response.body).toHaveProperty('data');
  });
});
```

Available auth helpers: `createAdminAndLogin()`, `createManagerAndLogin()`, `createNurseAndLogin()`, `createPatientAndLogin()`.

## Writing Guidelines

### Core Principles (Zinsser Method)

**Brevity is power.** Strip every sentence to its cleanest components. Remove every word that serves no function. Replace phrases with words. Choose simple words over complex ones.

### Clutter Elimination

- Cut qualifiers: "very", "quite", "rather", "somewhat", "pretty much"
- Remove redundant pairs: "each and every", "first and foremost", "various and sundry"
- Eliminate throat-clearing: "It is important to note that", "The fact that"
- Avoid inflated phrases: Use "now" not "at this point in time"
- Delete meaningless jargon: "utilize" → "use", "implement" → "do"

### Business Writing Rules

- Lead with the result, not the process
- Use active voice: "We fixed the bug" not "The bug was fixed"
- Write for the reader who knows nothing about your work
- State conclusions first, then explain if needed
- One idea per sentence, one topic per paragraph

### Technical Documentation

- Start with what it does, not how it works
- Use concrete examples over abstract descriptions
- Write instructions as commands: "Run tests" not "You should run tests"
- Assume intelligence but not knowledge
- Test your writing: Can someone follow it without you there?

### Code-Related Writing

- Variable names are sentences: make them clear, not clever
- Error messages should tell users what to do next
- Documentation should answer "why", code shows "what"
- PR descriptions: State changes and impacts, skip the journey
- Commit messages: What changed and why, in present tense

### The Zinsser Test

Before committing any written text, ask:

1. Can I cut this sentence in half?
2. Is there a simpler word?
3. Does the reader need to know this?
4. Am I saying this twice?

Remember: Clear writing is clear thinking. If you can't write it simply, you don't understand it well enough.

## Commit message guidelines

- Always write commits in English.
- Follow the conventional commit standard for all commits: eg: `feat(scope): message`
- Always check `git status` before committing to review staged files
- Create a main resume line highlighting the **most impactful change**, not implementation details
- Add a detailed description after a blank line with bullet points for supporting changes
- List secondary changes as bullet points, ordered by importance
- If multiple files are changed, only commit the files you explicitly staged (never include unrelated changes)
- Apply the Zinsser brevity principles: remove unnecessary words, use active voice, and write clearly
