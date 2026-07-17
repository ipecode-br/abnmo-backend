# Autenticação e autorização

## Visão geral

Autenticação baseada em **JWT armazenado em cookies HTTP-only assinados**. Não há header `Authorization` — os tokens trafegam via cookies, protegendo contra XSS.

Três guards globais são registrados em `AuthModule` como `APP_GUARD`, avaliados em ordem:

1. **`AuthGuard`** — valida o token JWT e popula o contexto da requisição.
2. **`RolesGuard`** — verifica restrições de perfil (`@Roles`). Admin sempre passa.
3. **`FeatureGuard`** — verifica features (`@RequireFeature`). Não valida ownership.

A validação de ownership é feita nos use-cases via `can()`.

---

## Cookies e tokens

| Cookie          | Duração | Finalidade                                  |
| --------------- | ------- | ------------------------------------------- |
| `access_token`  | 8 horas | Autenticação principal em cada requisição   |
| `refresh_token` | 30 dias | Renovação silenciosa do `access_token`      |

Tokens armazenados na tabela `tokens`:

| Tipo             | Duração | Finalidade              |
| ---------------- | ------- | ----------------------- |
| `password_reset` | 2 horas | Redefinição de senha    |
| `invite_user`    | 8 horas | Convite de novo usuário |

---

## `RequestUser`

O usuário autenticado é injetado via `@User()` com o tipo:

```typescript
type RequestUser = {
  id: string;
  email: string;
  role: UserRole;         // 'admin' | 'member' | 'specialist' | 'patient'
  features: UserFeature[]; // lista de features atribuídas
};
```

Perfis disponíveis (`USER_ROLES`):

| Perfil       | Valor          | Descrição                          |
| ------------ | -------------- | ---------------------------------- |
| `admin`      | `'admin'`      | Acesso total, bypass de guards     |
| `member`     | `'member'`     | Gestão operacional do sistema      |
| `specialist` | `'specialist'` | Especialistas (médicos, psicólogos, etc.) |
| `patient`    | `'patient'`    | Pacientes — acesso restrito aos próprios dados |

---

## Decorators

### `@Public()`

Pula `AuthGuard` — endpoint acessível sem autenticação:

```typescript
@Public()
@Post('/login')
async login(@Body() body: SignInWithEmailBody): Promise<BaseResponse> { ... }
```

### `@Roles([...roles])`

Restringe o acesso por perfil. Admin sempre passa, independentemente do valor declarado:

```typescript
@Roles(['member', 'specialist'])  // apenas member e specialist (+ admin)
@Roles(['all'])                    // qualquer usuário autenticado
```

Pode ser aplicado no controller (afeta todas as rotas) ou no método (sobrepõe o controller).

### `@RequireFeature(feature)`

Restringe o acesso por feature. Aceita uma feature única ou array (OR lógico). O guard **não** verifica ownership — isso é feito separadamente nos use-cases via `can()`:

```typescript
@RequireFeature('create:appointment')
@RequireFeature(['read:appointment', 'read:appointment:others'])
```

### `@User()`

Injeta o `RequestUser` da sessão atual:

```typescript
async create(@User() user: RequestUser, @Body() body: CreateAppointmentBody) { ... }
```

### `@Cookies('name')`

Injeta o valor bruto de um cookie assinado:

```typescript
async logout(@Cookies('refresh_token') refreshToken: string, @User() user: RequestUser) { ... }
```

---

## `can()` — autorização no use-case

Importado de `@/common/authorization/can`. Usado dentro dos use-cases para verificar **features e ownership**:

```typescript
import { can } from '@/common/authorization/can';

// Feature única + ownership: usuário precisa da feature E ter o mesmo ID
can(user, 'update:user', targetId);

// Múltiplas features (OR): basta ter UMA feature e passar ownership
can(user, ['update:appointment', 'update:appointment:others'], appointment.specialist?.id);

// Múltiplos owners: deve ter feature E bater com PELO MENOS UM owner
can(
  user,
  ['update:appointment', 'update:appointment:others'],
  [appointment.patient.id, appointment.specialist?.id || ''],
);
```

`compareToId` aceita `string | string[]`. Features com sufixo `:others` **ignoram** a verificação de ownership. `undefined` como `compareToId` pula a verificação de ownership.

---

## Features padrão por perfil

Cada perfil recebe um conjunto base de features ao ser criado:

| Perfil       | Features                                                                 |
| ------------ | ------------------------------------------------------------------------ |
| Todos        | `read:user`, `update:user`                                               |
| `member`     | + `read:patient`, `read:patient:others`                                   |
| `specialist` | + `create:appointment`, `read/update/cancel:appointment`, `read/update/cancel:referral` |
| `patient`    | + `read/update:patient`, `read:survey`, `read/update/cancel:appointment`, `read/update/cancel:referral` |

Para a lista completa de features disponíveis, veja [permissoes](permissions.md).

---

## Restrições de ownership nos use-cases

Além dos guards globais, use-cases aplicam `can()` para restringir acesso a recursos:

```typescript
// Paciente só vê os próprios atendimentos
if (user.role === 'patient') {
  where.patient = { id: user.id };
}

// Especialista só edita os próprios atendimentos (exceto se tiver :others)
can(user, ['update:appointment', 'update:appointment:others'], appointment.specialist?.id);
```
