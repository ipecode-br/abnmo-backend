# Use-cases

## O que é um use-case

Um use-case encapsula uma única operação de negócio. É onde vive toda a lógica da aplicação: validações, acesso ao banco, autorização com `can()` e transformações de dados.

**Um arquivo, uma responsabilidade.** Um use-case nunca mistura criar com buscar ou atualizar com cancelar.

---

## Estrutura padrão

```typescript
// src/app/http/appointments/use-cases/get-appointments.use-case.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { FindOptionsWhere, ILike, MoreThanOrEqual, LessThanOrEqual, Between, Repository } from 'typeorm';

import { can } from '@/common/authorization/can';
import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import type { RequestUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';

interface GetAppointmentsUseCaseInput {
  user: RequestUser;
  page: number;
  perPage: number;
  status?: AppointmentStatus;
  search?: string;
  startDate?: Date;
  endDate?: Date;
  order?: QueryOrder;
  orderBy?: AppointmentsOrderBy;
}

interface GetAppointmentsUseCaseOutput {
  appointments: AppointmentResponseSchema[];
  total: number;
}

@Injectable()
@Log()
export class GetAppointmentsUseCase {
  constructor(
    @InjectRepository(Appointment)
    private readonly appointmentsRepository: Repository<Appointment>,
    private readonly logger: LogService,
  ) {}

  async execute({
    user,
    page,
    perPage,
    status,
    search,
    startDate,
    endDate,
    orderBy,
    order,
  }: GetAppointmentsUseCaseInput): Promise<GetAppointmentsUseCaseOutput> {
    can(user, ['read:appointment', 'read:appointment:others']);

    const where: FindOptionsWhere<Appointment> = {};

    if (user.role === 'patient') {
      where.patient = { id: user.id };
    }

    if (status) where.status = status;
    if (search) where.professionalName = ILike(`%${search}%`);

    if (startDate && endDate) {
      where.date = Between(startDate, endDate);
    } else if (startDate) {
      where.date = MoreThanOrEqual(startDate);
    } else if (endDate) {
      where.date = LessThanOrEqual(endDate);
    }

    const total = await this.appointmentsRepository.count({ where });

    const appointments = await this.appointmentsRepository.find({
      select: { id: true, date: true, status: true, /* ... */ },
      relations: { patient: true, specialist: true },
      skip: (page - 1) * perPage,
      take: perPage,
      order: { [ORDER_BY_MAPPING[orderBy || 'date']]: order || 'DESC' },
      where,
    });

    return {
      appointments: appointments.map((a) => ({
        id: a.id,
        date: a.date,
        status: a.status,
        patient: { id: a.patient.id, name: a.patient.name, /* ... */ },
        specialist: a.specialist ? { id: a.specialist.id, /* ... */ } : null,
      })),
      total,
    };
  }
}
```

---

## Interfaces

Defina interfaces `Input` e `Output` explícitas no próprio arquivo do use-case:

```typescript
interface CancelAppointmentUseCaseInput {
  id: string;
  user: RequestUser;
}
// → execute(): Promise<void>

interface GetAppointmentsUseCaseOutput {
  appointments: AppointmentResponseSchema[];
  total: number;
}
// → execute(): Promise<GetAppointmentsUseCaseOutput>
```

Use os tipos inferidos dos response schemas como tipo de output (`z.infer<typeof schema>`).

---

## Injeção de repositórios

Repositórios são injetados diretamente no use-case via `@InjectRepository(Entity)`. Não existe camada de repositório separada:

```typescript
constructor(
  @InjectRepository(Appointment)
  private readonly appointmentsRepository: Repository<Appointment>,
  private readonly logger: LogService,
) {}
```

> As entidades injetadas devem estar registradas no `TypeOrmModule.forFeature([...])` do módulo pai.

---

## Operações de escrita

Sempre use o padrão `.create()` seguido de `.save()` — **nunca** use `repository.save()` diretamente:

```typescript
const appointment = this.appointmentsRepository.create({
  patient: { id: patientId },
  specialist: specialistId ? { id: specialistId } : undefined,
  date,
  status: 'scheduled',
  category,
  condition,
  createdBy: user.id,
});
await this.appointmentsRepository.save(appointment);

this.logger.log('Appointment created', { appointmentId: appointment.id });
```

---

## Consultas

Sempre selecione apenas os campos necessários:

```typescript
const appointments = await this.appointmentsRepository.find({
  select: {
    id: true,
    date: true,
    status: true,
    patient: { id: true, name: true, email: true },
    specialist: { id: true, name: true, email: true },
  },
  relations: { patient: true, specialist: true },
  where,
  order,
  skip,
  take,
});
```

Para filtros dinâmicos, construa o `where` incrementalmente:

```typescript
const where: FindOptionsWhere<Appointment> = {};
if (status) where.status = status;
if (search) where.patient = { name: ILike(`%${search}%`) };
if (startDate && endDate) where.createdAt = Between(startDate, endDate);
```

---

## Transações

Use `DataSource.transaction()` para operações atômicas em múltiplas tabelas:

```typescript
await this.dataSource.transaction(async (manager) => {
  const usersRepo = manager.getRepository(User);
  const surveysRepo = manager.getRepository(Survey);

  const user = usersRepo.create({ name, email, role: 'patient', ... });
  await usersRepo.save(user);

  const survey = surveysRepo.create({ user: { id: user.id }, status: 'pending_signature' });
  await surveysRepo.save(survey);
});
```

---

## Mapeamento de resposta

**Nunca** retorne entidades TypeORM diretamente. O `ZodSerializerInterceptor` valida respostas com `.strict()` — qualquer campo extra causa erro. Mapeie para objetos planos contendo apenas os campos do schema de response:

```typescript
return {
  appointments: appointments.map((a) => ({
    id: a.id,
    date: a.date,
    status: a.status,
    patient: { id: a.patient.id, name: a.patient.name, email: a.patient.email },
    specialist: a.specialist
      ? { id: a.specialist.id, name: a.specialist.name, email: a.specialist.email }
      : null,
  })),
  total,
};
```

---

## `can()` — autorização

Use `can()` para verificar features e ownership. Deve ser chamado no início do `execute()`, antes de qualquer operação:

```typescript
can(user, ['read:appointment', 'read:appointment:others']);
can(user, 'update:user', targetUserId);
can(user, ['update:appointment', 'update:appointment:others'], appointment.specialist?.id);
```

Ver [autenticação](authentication.md) para documentação completa do `can()`.

---

## Logging

Use-cases possuem o decorator `@Log()` (class-level). O `LogService` é injetado no construtor. Os eventos são registrados via `@Log('event_name')` no controller — o use-case apenas chama `this.logger.log()` / `.error()` para registrar operações:

```typescript
this.logger.log('Appointment created', { appointmentId: appointment.id });
this.logger.error('Create appointment failed: patient not found', { patientId });
```

Ver [logging](logging.md) para documentação completa.

---

## Convenções

| Item                | Padrão                           | Exemplo                          |
| ------------------- | -------------------------------- | -------------------------------- |
| Arquivo             | `{action}-{feature}.use-case.ts` | `create-appointment.use-case.ts` |
| Classe              | `{Action}{Feature}UseCase`       | `CreateAppointmentUseCase`       |
| Input               | `{Action}{Feature}UseCaseInput`  | `CreateAppointmentUseCaseInput`  |
| Output              | `{Action}{Feature}UseCaseOutput` | `GetAppointmentsUseCaseOutput`   |

---

## Regras

- Um use-case por arquivo — uma ação por use-case.
- `@Log()` e `@Injectable()` sempre presentes, nesta ordem.
- Repositórios injetados diretamente — nunca importar serviços de outras features.
- Sempre chamar `can()` no início do `execute()` quando necessário.
- Sempre usar `.create()` + `.save()` — nunca `repository.save()` diretamente.
- Sempre mapear entidades para objetos planos antes de retornar.
- Selecionar apenas os campos necessários nas queries (`select: { ... }`).
- Mensagens de exceção em **português (pt-BR)**; mensagens de log em **inglês**.
