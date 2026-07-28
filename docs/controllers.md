# Controllers

## O que é um controller

O controller recebe requisições HTTP, extrai parâmetros (body, query, params, usuário) e delega a execução para o use-case. Após receber o resultado, formata e retorna a resposta.

**Controllers não contêm lógica de negócio.** Toda validação, acesso ao banco e tratamento de erros fica nos use-cases.

---

## Exemplo real

```typescript
// src/app/http/appointments/appointments.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
} from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { ZodResponse } from 'nestjs-zod';

import { RequireFeature } from '@/common/decorators/require-feature.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse, UUIDParams } from '@/common/dtos';
import { Log } from '@/common/log/log.decorator';
import type { RequestUser } from '@/common/types';

import {
  CreateAppointmentBody,
  GetAppointmentsQuery,
  GetAppointmentsResponse,
  UpdateAppointmentBody,
} from './appointments.dtos';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';

@ApiTags('Atendimentos')
@Controller('appointments')
export class AppointmentsController {
  constructor(
    private readonly getAppointmentsUseCase: GetAppointmentsUseCase,
    private readonly createAppointmentUseCase: CreateAppointmentUseCase,
    private readonly updateAppointmentUseCase: UpdateAppointmentUseCase,
    private readonly cancelAppointmentUseCase: CancelAppointmentUseCase,
  ) {}

  @Get()
  @RequireFeature(['read:appointment', 'read:appointment:others'])
  @ApiOperation({ summary: 'Lista todos os atendimentos' })
  @ZodResponse({ type: GetAppointmentsResponse, status: 200 })
  async getAppointments(
    @Query() query: GetAppointmentsQuery,
    @User() user: RequestUser,
  ): Promise<GetAppointmentsResponse> {
    const data = await this.getAppointmentsUseCase.execute({ user, ...query });
    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Log('create_appointment')
  @RequireFeature('create:appointment')
  @ApiOperation({ summary: 'Cadastra um novo atendimento' })
  @ZodResponse({ type: BaseResponse, status: 201 })
  async create(
    @User() user: RequestUser,
    @Body() body: CreateAppointmentBody,
  ): Promise<BaseResponse> {
    await this.createAppointmentUseCase.execute({ user, ...body });
    return { success: true, message: 'Atendimento cadastrado com sucesso.' };
  }

  @Put(':id')
  @Log('update_appointment')
  @RequireFeature(['update:appointment', 'update:appointment:others'])
  @ApiOperation({ summary: 'Atualiza os dados do atendimento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async update(
    @Param() { id }: UUIDParams,
    @User() user: RequestUser,
    @Body() body: UpdateAppointmentBody,
  ): Promise<BaseResponse> {
    await this.updateAppointmentUseCase.execute({ id, user, ...body });
    return { success: true, message: 'Atendimento atualizado com sucesso.' };
  }

  @Patch(':id/cancel')
  @Log('cancel_appointment')
  @RequireFeature(['cancel:appointment', 'cancel:appointment:others'])
  @ApiOperation({ summary: 'Cancela o atendimento' })
  @ZodResponse({ type: BaseResponse, status: 200 })
  async cancel(
    @Param() { id }: UUIDParams,
    @User() user: RequestUser,
  ): Promise<BaseResponse> {
    await this.cancelAppointmentUseCase.execute({ id, user });
    return { success: true, message: 'Atendimento cancelado com sucesso.' };
  }
}
```

---

## Decorators de rota

### `@Controller(path)`

Define o prefixo de todas as rotas do controller. O path segue `kebab-case`:

```typescript
@Controller('appointments')
```

### `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`

Métodos HTTP. Aceitam path relativo opcional:

```typescript
@Get()              // GET /appointments
@Get(':id')         // GET /appointments/:id
@Patch(':id/cancel') // PATCH /appointments/:id/cancel
```

### `@RequireFeature(feature)`

Restringe por feature. OR lógico com array. Ver [autenticação](authentication.md).

### `@Public()`

Pula `AuthGuard` — endpoint público.

### `@Log('event_name')`

Registra um evento auditável na requisição. Aplicado nos métodos dos controllers que realizam mutações. Ver [logging](logging.md).

### `@ZodResponse({ type, status })`

**Obrigatório** em todos os endpoints. Valida e serializa a resposta contra o schema Zod em runtime. **Nunca** use `@ApiResponse` para validação de resposta.

| HTTP  | Quando                                                |
| ----- | ----------------------------------------------------- |
| `200` | GET que retorna dados, ações que retornam confirmação |
| `201` | POST que cria um recurso                              |

---

## Decorators de parâmetros

### `@User()`

Injeta o `RequestUser` autenticado:

```typescript
async create(@User() user: RequestUser) { ... }
```

### `@Query()`

Injeta parâmetros de query string validados pelo DTO:

```typescript
async list(@Query() query: GetAppointmentsQuery) { ... }
```

### `@Body()`

Injeta o corpo da requisição validado pelo DTO:

```typescript
async create(@Body() body: CreateAppointmentBody) { ... }
```

### `@Param('name')`

Injeta um parâmetro de rota. Para parâmetros `:id` que representam UUIDs, use o DTO compartilhado `UUIDParams` com destructuring — o `ZodValidationPipe` global valida automaticamente o formato UUID v7:

```typescript
async cancel(@Param() { id }: UUIDParams) { ... }
```

Para parâmetros que não são UUIDs, use a extração direta com `string`:

```typescript
async findByToken(@Param('token') token: string) { ... }
```

Nunca use `@Param('id') id: string` para UUIDs — isso contorna a validação e permite que strings inválidas cheguem ao banco de dados.

### `@Cookies('cookie_name')`

Injeta um cookie assinado:

```typescript
async logout(@Cookies('refresh_token') refreshToken: string) { ... }
```

---

## Regras

- Todo endpoint não-`@Public()` deve ter obrigatoriamente um `@RequireFeature()` — endpoints sem feature são bloqueados pelo `FeatureGuard`.
- Sempre tipar o retorno: `Promise<BaseResponse>`, `Promise<GetAppointmentsResponse>`, etc.
- Toda rota de mutação deve ter `@Log('event_name')`.
- Toda rota deve ter `@ZodResponse({ type, status })` — nunca `@ApiResponse`.
- `@ApiOperation` é usado apenas para o sumário no Swagger.
- Mensagens de resposta em **português (pt-BR)**.
- Nunca injetar `@Res()` diretamente — use retornos + exceções HTTP.
- Injetar use-cases via `constructor` com `private readonly`.
- Nunca acessar repositórios ou aplicar lógica de negócio no controller.
