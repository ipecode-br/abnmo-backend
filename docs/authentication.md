# Autenticação e autorização

## Visão geral

A autenticação é baseada em **JWT armazenado em cookies HTTP-only assinados**. Não há header `Authorization` — todos os tokens trafegam via cookies, o que protege contra ataques XSS.

Dois guards globais são registrados em `AuthModule` como `APP_GUARD` e aplicados em toda a aplicação:

- **`AuthGuard`** — verifica autenticação (token válido).
- **`RolesGuard`** — verifica autorização (perfil permitido).

---

## Cookies e tokens

| Cookie | Duração | Finalidade |
|---|---|---|
| `access_token` | 8 horas | Autenticação principal em cada requisição |
| `refresh_token` | 30 dias | Renovação silenciosa do `access_token` |

Além dos cookies, dois tipos de token são armazenados na tabela `tokens` no banco:

| Tipo | Duração | Finalidade |
|---|---|---|
| `password_reset` | 2 horas | Redefinição de senha |
| `invite_user` | 8 horas | Convite de novo usuário |

---

## Fluxo de autenticação

```
Requisição
  → AuthGuard
      ├── acesso_token válido → autentica e continua
      ├── access_token ausente/expirado + refresh_token válido
      │     → valida refresh no banco
      │     → emite novo access_token (silent refresh)
      │     → continua
      └── nenhum token válido → UnauthorizedException (401)
  → RolesGuard
      ├── @Public() → pula verificação
      ├── role === 'admin' → always allowed
      ├── role está em @Roles([...]) → continua
      └── role not allowed → ForbiddenException (403)
```

O `AuthGuard` também popula o contexto da requisição:
- `request.user` com o `AuthUser` autenticado.
- `ContextService.setUser(user)` para enriquecer os logs.

---

## `AuthUser`

O tipo do usuário autenticado disponível em toda a aplicação:

```typescript
// src/common/types.d.ts
type AuthUser = {
  id: string;
  email: string;
  role: AuthTokenRole; // 'admin' | 'manager' | 'nurse' | 'specialist' | 'patient'
};
```

---

## Decorators

### `@Roles([...roles])`

Restringe o acesso ao handler ou controller por perfil. Aceita um array de `AllowedRole`:

```typescript
@Roles(['manager', 'nurse'])           // apenas manager e nurse
@Roles(['all'])                        // qualquer usuário autenticado
@Roles(['manager', 'nurse', 'patient']) // múltiplos perfis
```

Pode ser aplicado no nível do controller (afeta todas as rotas) ou no nível do método (sobrepõe o controller):

```typescript
@Roles(['manager', 'nurse', 'specialist'])  // padrão do controller
@Controller('appointments')
export class AppointmentsController {

  @Get()
  @Roles(['all'])  // sobrepõe — qualquer autenticado pode listar
  async getAppointments() { ... }

  @Post()  // usa o @Roles do controller
  async create() { ... }
}
```

> **Admin bypass:** o `RolesGuard` permite acesso de usuários com `role === 'admin'` independentemente do `@Roles` declarado.

### `@Public()`

Marca um endpoint como público — os guards são ignorados completamente:

```typescript
@Public()
@Post('/login')
async login(@Body() dto: SignInWithEmailDto) { ... }

@Public()
@Post('/register/patient')
async registerPatient(@Body() dto: RegisterPatientDto) { ... }
```

### `@User()`

Decorator de parâmetro que injeta o `AuthUser` da requisição atual:

```typescript
async create(
  @User() user: AuthUser,
  @Body() dto: CreateAppointmentDto,
): Promise<BaseResponse> {
  await this.createAppointmentUseCase.execute({ user, ...dto });
  // ...
}
```

### `@Cookies('nome')`

Decorator de parâmetro que lê um cookie assinado da requisição. Usado principalmente no módulo de autenticação:

```typescript
async logout(
  @Cookies('refresh_token') refreshToken: string,
  @User() user: AuthUser,
): Promise<BaseResponse> {
  await this.logoutUseCase.execute({ refreshToken, user });
  // ...
}
```

---

## Perfis e permissões

| Perfil | Valor | Descrição |
|---|---|---|
| `admin` | `'admin'` | Acesso total, bypass de todos os guards de role |
| `manager` | `'manager'` | Gestão geral do sistema |
| `nurse` | `'nurse'` | Operações clínicas |
| `specialist` | `'specialist'` | Especialistas (médicos, psicólogos, etc.) |
| `patient` | `'patient'` | Pacientes — acesso restrito aos próprios dados |

Para a matriz completa de permissões por endpoint, veja [permissões](permissions.md).

---

## Restrições de ownership em use-cases

Alguns perfis têm acesso restrito aos próprios dados. Essas verificações são feitas nos use-cases, não nos guards:

```typescript
// Pacientes só visualizam os próprios atendimentos
if (user.role === 'patient') {
  where.patientId = user.id;
}

// Usuários só atualizam o próprio perfil (exceto admin)
if (user.id !== targetId && user.role !== 'admin') {
  throw new ForbiddenException('Você não tem permissão para atualizar este usuário.');
}
```
