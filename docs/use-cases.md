# Use-cases

## O que é um use-case

Um use-case encapsula uma única operação de negócio. É a camada onde vive toda a lógica da aplicação: validações de regras de negócio, consultas ao banco, transformações de dados e lançamento de exceções.

Cada use-case é responsável por **uma única ação** — criar, buscar, atualizar, cancelar, etc. A regra é: um arquivo, uma responsabilidade.

---

## Estrutura padrão

```typescript
// src/app/http/appointments/use-cases/create-appointment.use-case.ts
import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { Logger } from '@/common/log/logger.decorator';
import { AppLogger } from '@/common/log/logger.service';
import type { AuthUser } from '@/common/types';
import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import type { PatientCondition } from '@/domain/enums/patients';
import type { SpecialtyCategory } from '@/domain/enums/shared';

interface CreateAppointmentUseCaseInput {
  user: AuthUser;
  patientId: string;
  date: Date;
  condition: PatientCondition;
  annotation: string | null;
  professionalName: string | null;
  category?: SpecialtyCategory;
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

    await this.appointmentsRepository.save({
      ...input,
      status: 'scheduled',
      createdBy: input.user.id,
    });

    this.logger.log('Appointment created successfully', {
      patientId: input.patientId,
      createdBy: input.user.id,
    });
  }
}
```

---

## Interfaces de input e output

Defina interfaces TypeScript explícitas para entrada e saída diretamente no arquivo do use-case. Nunca use `any` ou objetos genéricos:

```typescript
// Input sem dados retornados (mutação)
interface CancelAppointmentUseCaseInput {
  id: string;
  user: AuthUser;
}
// → execute retorna Promise<void>

// Input com dados retornados (consulta)
interface GetAppointmentsUseCaseInput {
  user: AuthUser;
  page: number;
  perPage: number;
  status?: AppointmentStatus;
  search?: string;
}

interface GetAppointmentsUseCaseOutput {
  appointments: Appointment[];
  total: number;
}
// → execute retorna Promise<GetAppointmentsUseCaseOutput>
```

---

## Injeção de repositórios

Os repositórios são injetados diretamente no use-case via `@InjectRepository(Entity)`. Não existe camada de repositório separada:

```typescript
constructor(
  @InjectRepository(Appointment)
  private readonly appointmentsRepository: Repository<Appointment>,
  @InjectRepository(Patient)
  private readonly patientsRepository: Repository<Patient>,
  private readonly logger: AppLogger,
) {}
```

> As entidades injetadas no use-case devem estar registradas no `TypeOrmModule.forFeature([...])` do módulo pai. Veja [módulos](modules.md).

---

## Consultas ao banco

Sempre selecione apenas os campos necessários para evitar over-fetching:

```typescript
// Busca com campos específicos
const patient = await this.patientsRepository.findOne({
  where: { id: patientId },
  select: { id: true, name: true, status: true },
});

// Contagem — seleciona apenas id para performance
const [appointments, total] = await this.appointmentsRepository.findAndCount({
  where,
  select: { id: true },
  take: perPage,
  skip: (page - 1) * perPage,
});
```

Para filtros dinâmicos, construa o objeto `where` incrementalmente com os operadores do TypeORM:

```typescript
import { Between, ILike, type FindOptionsWhere } from 'typeorm';

const where: FindOptionsWhere<Appointment> = {};

if (user.role === 'patient') {
  where.patientId = user.id;  // pacientes só veem os próprios dados
}

if (search) {
  where.professionalName = ILike(`%${search}%`);
}

if (startDate && endDate) {
  where.date = Between(startDate, endDate);
}
```

---

## Transações

Use `DataSource` com `dataSource.transaction()` quando precisar salvar em múltiplas tabelas de forma atômica:

```typescript
import { InjectDataSource } from '@nestjs/typeorm';
import { DataSource } from 'typeorm';

@Injectable()
export class CreatePatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    @InjectDataSource()
    private readonly dataSource: DataSource,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreatePatientUseCaseInput): Promise<void> {
    this.logger.setEvent('create_patient');

    await this.dataSource.transaction(async (manager) => {
      const patient = await manager.save(Patient, { ...patientData });

      if (input.supports?.length) {
        await manager.save(
          PatientSupport,
          input.supports.map((s) => ({ ...s, patientId: patient.id })),
        );
      }
    });

    this.logger.log('Patient created successfully', { email: input.email });
  }
}
```

---

## Logging

Todo use-case com o decorator `@Logger()` deve chamar `this.logger.setEvent()` como primeira linha do `execute()`. Veja [logging](logging.md) para detalhes completos.

```typescript
async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
  this.logger.setEvent('create_appointment');  // sempre na primeira linha
  // ...
}
```

---

## Tratamento de erros

Exceções NestJS são lançadas diretamente no use-case com mensagens em português (pt-BR) para o usuário. Erros internos são logados em inglês. Veja [tratamento de erros](error-handling.md).

```typescript
const appointment = await this.appointmentsRepository.findOne({ where: { id } });

if (!appointment) {
  throw new NotFoundException('Atendimento não encontrado.');
}

if (appointment.status === 'canceled') {
  this.logger.warn('Cancel appointment failed: already canceled', { id });
  throw new BadRequestException('Este atendimento já foi cancelado.');
}
```

---

## Convenções de nomenclatura

| Item | Padrão | Exemplo |
|---|---|---|
| Arquivo | `{action}-{feature}.use-case.ts` | `create-appointment.use-case.ts` |
| Classe | `{Action}{Feature}UseCase` | `CreateAppointmentUseCase` |
| Interface de input | `{Action}{Feature}UseCaseInput` | `CreateAppointmentUseCaseInput` |
| Interface de output | `{Action}{Feature}UseCaseOutput` | `GetAppointmentsUseCaseOutput` |

---

## Regras

- Um use-case por arquivo — nunca combinar múltiplas ações em um só use-case.
- Interfaces `Input` e `Output` definidas no mesmo arquivo do use-case.
- Repositórios injetados diretamente — nunca importar serviços ou use-cases de outras features.
- `@Logger()` e `@Injectable()` sempre presentes, nesta ordem.
- `this.logger.setEvent()` sempre como primeira linha do `execute()`.
- Mensagens de exceção em português (pt-BR); mensagens de log em inglês.
- Selecionar apenas os campos necessários nas queries (`select: { id: true, ... }`).
