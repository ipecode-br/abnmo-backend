# Controllers

## O que é um controller

O controller é responsável por receber as requisições HTTP, extrair os parâmetros (body, query, params, usuário autenticado) e delegar a execução para o use-case correspondente. Após receber o resultado, ele formata e retorna a resposta.

**Controllers não contêm lógica de negócio.** Toda validação de regras de negócio, acesso ao banco e tratamento de erros fica nos use-cases.

---

## Estrutura

```typescript
// src/app/http/appointments/appointments.controller.ts
import { Body, Controller, Get, Param, Patch, Post, Put, Query } from '@nestjs/common';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';

import { Roles } from '@/common/decorators/roles.decorator';
import { User } from '@/common/decorators/user.decorator';
import { BaseResponse } from '@/common/dtos';
import type { AuthUser } from '@/common/types';

import {
  CreateAppointmentDto,
  GetAppointmentsQuery,
  GetAppointmentsResponse,
  UpdateAppointmentDto,
} from './appointments.dtos';
import { CancelAppointmentUseCase } from './use-cases/cancel-appointment.use-case';
import { CreateAppointmentUseCase } from './use-cases/create-appointment.use-case';
import { GetAppointmentsUseCase } from './use-cases/get-appointments.use-case';
import { UpdateAppointmentUseCase } from './use-cases/update-appointment.use-case';

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
  @Roles(['all'])
  @ApiOperation({ summary: 'Lista todos os atendimentos' })
  @ApiResponse({ type: GetAppointmentsResponse })
  async getAppointments(
    @Query() query: GetAppointmentsQuery,
    @User() user: AuthUser,
  ): Promise<GetAppointmentsResponse> {
    const data = await this.getAppointmentsUseCase.execute({ user, ...query });

    return {
      success: true,
      message: 'Lista de atendimentos retornada com sucesso.',
      data,
    };
  }

  @Post()
  @Roles(['manager', 'nurse', 'specialist'])
  @ApiOperation({ summary: 'Cadastra um novo atendimento' })
  @ApiResponse({ type: BaseResponse })
  async create(
    @User() user: AuthUser,
    @Body() createAppointmentDto: CreateAppointmentDto,
  ): Promise<BaseResponse> {
    await this.createAppointmentUseCase.execute({ user, ...createAppointmentDto });

    return {
      success: true,
      message: 'Atendimento cadastrado com sucesso.',
    };
  }

  @Put(':id')
  @Roles(['manager', 'nurse', 'specialist'])
  async update(
    @Param('id') id: string,
    @User() user: AuthUser,
    @Body() updateAppointmentDto: UpdateAppointmentDto,
  ): Promise<BaseResponse> {
    await this.updateAppointmentUseCase.execute({ id, user, ...updateAppointmentDto });

    return { success: true, message: 'Atendimento atualizado com sucesso.' };
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

---

## Decorators de rota

### `@Controller(path)`

Define o prefixo de todas as rotas do controller. O path segue `kebab-case`:

```typescript
@Controller('patient-requirements')
```

### `@Get()`, `@Post()`, `@Put()`, `@Patch()`, `@Delete()`

Métodos HTTP. Aceitam um path relativo opcional:

```typescript
@Get()              // GET /appointments
@Get(':id')         // GET /appointments/:id
@Patch(':id/cancel') // PATCH /appointments/:id/cancel
```

### `@Roles([...roles])`

Restringe o acesso ao handler por perfil. Ver [autenticação](authentication.md) para detalhes completos.

```typescript
@Roles(['manager', 'nurse'])           // apenas manager e nurse
@Roles(['all'])                        // qualquer usuário autenticado
@Roles(['manager', 'nurse', 'patient']) // múltiplos papéis
```

> Admin sempre tem acesso, independentemente do `@Roles` declarado.

### `@Public()`

Marca o endpoint como público — ignora `AuthGuard` e `RolesGuard`:

```typescript
@Public()
@Post('/login')
async login(@Body() dto: SignInWithEmailDto) { ... }
```

---

## Decorators de parâmetros

### `@User()`

Injeta o usuário autenticado da requisição como `AuthUser`:

```typescript
async create(@User() user: AuthUser) {
  // user.id, user.email, user.role
}
```

### `@Query()`

Injeta os parâmetros de query string, validados pelo DTO:

```typescript
async list(@Query() query: GetAppointmentsQuery) { ... }
```

### `@Body()`

Injeta o corpo da requisição, validado pelo DTO:

```typescript
async create(@Body() dto: CreateAppointmentDto) { ... }
```

### `@Param('name')`

Injeta um parâmetro de rota:

```typescript
async cancel(@Param('id') id: string) { ... }
```

### `@Cookies('cookie_name')`

Injeta um cookie assinado da requisição. Usado principalmente no módulo de autenticação:

```typescript
async logout(@Cookies('refresh_token') refreshToken: string) { ... }
```

---

## Regras

- Sempre tipar o retorno dos métodos: `Promise<BaseResponse>`, `Promise<GetAppointmentsResponse>`, etc.
- Mensagens de resposta em português (pt-BR).
- Nunca retornar dados brutos — sempre retornar `{ success: true, message: '...', data: ... }`.
- Nunca acessar repositórios ou aplicar lógica de negócio no controller.
- Injetar todos os use-cases via `constructor` com `private readonly`.
- Adicionar `@ApiTags`, `@ApiOperation` e `@ApiResponse` para documentação Swagger.
