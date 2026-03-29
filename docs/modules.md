# Módulos

## O que é um módulo

Um módulo NestJS agrupa um conjunto de controllers e use-cases relacionados a uma única feature. Cada módulo é auto-contido: registra suas próprias entidades, declara seus controllers e fornece seus use-cases como providers.

A estrutura de quatro arquivos por feature é obrigatória:

```
src/app/http/{feature}/
├── {feature}.module.ts       # Módulo NestJS da feature
├── {feature}.controller.ts   # Rotas HTTP
├── {feature}.dtos.ts         # DTOs derivados dos schemas Zod
└── use-cases/
    ├── get-{feature}.use-case.ts
    ├── create-{feature}.use-case.ts
    ├── update-{feature}.use-case.ts
    └── ...
```

---

## Criando um módulo

### 1. Arquivo do módulo (`{feature}.module.ts`)

O módulo registra as entidades TypeORM necessárias pelo `TypeOrmModule.forFeature`, declara o controller e lista todos os use-cases como providers:

```typescript
// src/app/http/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';

import { AppointmentsController } from './appointments.controller';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';

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

### 2. Registrar no `AppModule`

Após criar o módulo, importe-o no `AppModule` em `src/app/app.module.ts`:

```typescript
import { AppointmentsModule } from './http/appointments/appointments.module';

@Module({
  imports: [
    // ...outros módulos
    AppointmentsModule,
  ],
})
export class AppModule {}
```

---

## Independência entre módulos

Cada módulo **não deve depender de outros módulos de feature**. Os use-cases acessam os repositórios diretamente via `@InjectRepository`, sem passar por services ou use-cases de outros módulos.

Se uma feature precisar de entidades de outro domínio (ex: `AppointmentsModule` verificando o `Patient`), basta registrar a entidade no `TypeOrmModule.forFeature` do próprio módulo:

```typescript
// AppointmentsModule precisa de Patient e User para validações
imports: [TypeOrmModule.forFeature([Appointment, Patient, User])],
```

---

## Importando módulos compartilhados

Alguns módulos fornecem serviços que podem ser necessários em features específicas. Esses módulos são importados explicitamente apenas onde forem necessários:

```typescript
// UsersModule precisa de criptografia e e-mail
import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { MailModule } from '@/app/mail/mail.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token, Patient]),
    CryptographyModule,  // para hash de senhas e geração de JWT
    MailModule,          // para envio de convites por e-mail
  ],
  controllers: [UsersController],
  providers: [...],
})
export class UsersModule {}
```

| Módulo compartilhado | Quando importar |
|---|---|
| `CryptographyModule` | Quando o módulo precisar criar/verificar hashes ou tokens JWT |
| `MailModule` | Quando o módulo precisar enviar e-mails |
| `UtilsModule` | Quando o módulo precisar manipular cookies ou calcular períodos de data |
| `EnvModule` | Quando o módulo precisar de acesso a variáveis de ambiente |

> `LogModule` é global e não precisa ser importado.

---

## Convenções de nomenclatura

| Arquivo | Padrão | Exemplo |
|---|---|---|
| Módulo | `{feature}.module.ts` | `appointments.module.ts` |
| Controller | `{feature}.controller.ts` | `appointments.controller.ts` |
| DTOs | `{feature}.dtos.ts` | `appointments.dtos.ts` |
| Use-case | `{action}-{feature}.use-case.ts` | `create-appointment.use-case.ts` |
| Classe do módulo | `{Feature}Module` | `AppointmentsModule` |
| Classe do controller | `{Feature}Controller` | `AppointmentsController` |
| Classe do use-case | `{Action}{Feature}UseCase` | `CreateAppointmentUseCase` |

Todos os arquivos seguem o padrão `kebab-case`.
