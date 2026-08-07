# Módulos

## O que é um módulo

Um módulo NestJS agrupa controllers e use-cases de uma feature. Cada módulo é auto-contido: registra suas entidades, declara seus controllers e fornece seus use-cases como providers.

Estrutura de quatro arquivos por feature:

```
src/app/http/{feature}/
├── {feature}.module.ts
├── {feature}.controller.ts
├── {feature}.dtos.ts
└── use-cases/
    ├── get-{feature}.use-case.ts
    ├── create-{feature}.use-case.ts
    └── ...
```

---

## Criando um módulo

### Arquivo do módulo (`{feature}.module.ts`)

```typescript
// src/app/http/appointments/appointments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Appointment } from '@/domain/entities/appointment';
import { User } from '@/domain/entities/user';

import { AppointmentsController } from './appointments.controller';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';

@Module({
  imports: [TypeOrmModule.forFeature([Appointment, User])],
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

### Registrar no `AppModule`

Importe o módulo no `AppModule` em `src/app/app.module.ts`:

```typescript
import { AppointmentsModule } from './http/appointments/appointments.module';

@Module({
  imports: [
    AppointmentsModule,
    // ...outros módulos
  ],
})
export class AppModule {}
```

---

## Independência entre módulos

Cada módulo **não deve depender de outros módulos de feature**. Use-cases acessam repositórios diretamente via `@InjectRepository`, sem passar por serviços de outros módulos.

Se uma feature precisa de entidades de outro domínio, basta registrar a entidade no `TypeOrmModule.forFeature` do próprio módulo:

```typescript
// AppointmentsModule precisa de User para validações
imports: [TypeOrmModule.forFeature([Appointment, User])],
```

---

## Módulos compartilhados

Serviços reutilizáveis são importados apenas onde necessários:

```typescript
import { CryptographyModule } from '@/app/cryptography/cryptography.module';

@Module({
  imports: [
    TypeOrmModule.forFeature([User, Token]),
    CryptographyModule,  // hash, JWT, cookies
  ],
  controllers: [UsersController],
  providers: [...],
})
export class UsersModule {}
```

| Módulo compartilhado | Quando importar                                     |
| -------------------- | --------------------------------------------------- |
| `CryptographyModule` | Hash de senhas, criação/verificação de JWT, cookies |
| `StorageModule`      | Upload de arquivos (S3/CDN com signed URLs)         |

> `LogModule`, `QueueModule` e `EnvModule` são globais e não precisam ser importados.

---

## Convenções

| Arquivo    | Padrão                           | Exemplo                          |
| ---------- | -------------------------------- | -------------------------------- |
| Módulo     | `{feature}.module.ts`            | `appointments.module.ts`         |
| Controller | `{feature}.controller.ts`        | `appointments.controller.ts`     |
| DTOs       | `{feature}.dtos.ts`              | `appointments.dtos.ts`           |
| Use-case   | `{action}-{feature}.use-case.ts` | `create-appointment.use-case.ts` |

Todos os arquivos seguem `kebab-case`.
