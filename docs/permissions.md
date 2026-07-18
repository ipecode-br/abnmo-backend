# Permissões de acesso

## Visão geral

O sistema usa um modelo de **features** — permissões atômicas no formato `action:resource`. Cada usuário possui uma lista de features atribuídas. Os guards e a função `can()` verificam essas features a cada requisição.

```
action:resource               → feature própria (requer ownership match)
action:resource:others        → feature ampla (bypassa verificação de ownership)
```

---

## Features disponíveis (`USER_FEATURES`)

### Surveys

| Feature                 | Descrição                                           |
| ----------------------- | --------------------------------------------------- |
| `read:survey`           | Visualizar as próprias catalogações                 |
| `read:survey:others`    | Visualizar catalogações de outros pacientes         |
| `review:survey`        | Aprovar/rejeitar submissões de catalogação          |
| `update:survey`         | Editar a própria catalogação                        |
| `update:survey:others`  | Editar catalogações de outros pacientes             |
| `cancel:survey`         | Cancelar a própria catalogação                      |
| `cancel:survey:others`  | Cancelar catalogações de outros pacientes           |

### Patients

| Feature                | Descrição                                           |
| ---------------------- | --------------------------------------------------- |
| `read:patient`         | Visualizar os próprios dados                        |
| `read:patient:others`  | Visualizar dados de outros pacientes                |
| `update:patient`       | Editar os próprios dados                            |
| `update:patient:others`| Editar dados de outros pacientes                    |
| `activate:patient`     | Ativar pacientes inativos                           |
| `deactivate:patient`   | Inativar pacientes                                  |

### Patient requirements

| Feature                        | Descrição                                           |
| ------------------------------ | --------------------------------------------------- |
| `create:patient-requirement`   | Criar solicitações                                  |
| `read:patient-requirement`     | Visualizar as próprias solicitações                 |
| `read:patient-requirement:others`| Visualizar solicitações de outros pacientes        |
| `update:patient-requirement`   | Editar as próprias solicitações                     |
| `update:patient-requirement:others`| Editar solicitações de outros pacientes          |
| `review:patient-requirement`   | Aprovar/rejeitar solicitações                       |

### Appointments

| Feature                     | Descrição                                          |
| --------------------------- | -------------------------------------------------- |
| `create:appointment`        | Criar atendimentos                                 |
| `read:appointment`          | Visualizar os próprios atendimentos                |
| `read:appointment:others`   | Visualizar atendimentos de outros                  |
| `update:appointment`        | Editar os próprios atendimentos                    |
| `update:appointment:others` | Editar atendimentos de outros                      |
| `cancel:appointment`        | Cancelar os próprios atendimentos                  |
| `cancel:appointment:others` | Cancelar atendimentos de outros                    |

### Referrals

| Feature                   | Descrição                                           |
| ------------------------- | --------------------------------------------------- |
| `create:referral`         | Criar encaminhamentos                               |
| `read:referral`           | Visualizar os próprios encaminhamentos              |
| `read:referral:others`    | Visualizar encaminhamentos de outros                |
| `update:referral`         | Editar os próprios encaminhamentos                  |
| `update:referral:others`  | Editar encaminhamentos de outros                    |
| `cancel:referral`         | Cancelar os próprios encaminhamentos                |
| `cancel:referral:others`  | Cancelar encaminhamentos de outros                  |

### Users

| Feature              | Descrição                                           |
| -------------------- | --------------------------------------------------- |
| `read:user`          | Visualizar o próprio usuário                        |
| `read:user:others`   | Visualizar outros usuários                          |
| `update:user`        | Editar o próprio usuário                            |
| `update:user:others` | Editar outros usuários                              |
| `activate:user`      | Ativar usuários inativos                            |
| `deactivate:user`    | Inativar usuários                                   |

### User invites

| Feature               | Descrição                                        |
| --------------------- | ------------------------------------------------ |
| `create:user-invite`  | Criar convites para novos usuários               |
| `read:user-invite`    | Visualizar convites enviados                     |
| `delete:user-invite`  | Cancelar convites pendentes                      |

---

## Features padrão por perfil

| Perfil       | Features                                                                                                |
| ------------ | ------------------------------------------------------------------------------------------------------- |
| **Todos**    | `read:user`, `update:user`                                                                              |
| **member**   | + `read:patient`, `read:patient:others`                                                                 |
| **specialist**| + `create:appointment`, `read:appointment`, `update:appointment`, `cancel:appointment`, `read:referral`, `update:referral`, `cancel:referral` |
| **patient**  | + `read:patient`, `update:patient`, `read:survey`, `read:appointment`, `update:appointment`, `cancel:appointment`, `read:referral`, `update:referral`, `cancel:referral` |

**Admin** não requer features — `can()` retorna `true` incondicionalmente para admins.

---

## `can()` — verificação em use-cases

A função `can()` é usada dentro dos use-cases para verificar se o usuário possui a feature necessária **e** se tem ownership sobre o recurso:

```typescript
import { can } from '@/common/authorization/can';

// Feature única
can(user, 'create:appointment');

// Feature única + ownership: usuário deve ter a feature E ter o mesmo ID
can(user, 'update:user', targetUserId);

// Múltiplas features (OR): ter UMA feature + passar ownership
can(user, ['update:appointment', 'update:appointment:others'], appointment.specialist?.id);

// Múltiplos owners: ter feature + ser UM dos owners
can(user, ['read:appointment', 'read:appointment:others'], [patientId, specialistId]);
```

### Regras do `can()`

- Admin sempre retorna `true` — não verifica features nem ownership.
- Features com sufixo `:others` **ignoram** ownership — acesso amplo.
- `compareToId` aceita `string | string[]` — permite múltiplos owners.
- `compareToId` como `undefined` pula verificação de ownership — apenas feature é validada.
- Se nenhuma feature bater, lança `ForbiddenException`.

---

## Controle de ownership nos use-cases

Além do `can()`, use-cases também aplicam filtros condicionais para restringir dados retornados:

```typescript
// Paciente só vê registros vinculados ao seu ID
if (user.role === 'patient') {
  where.patient = { id: user.id };
}

// Especialista sem :others vê apenas os próprios atendimentos
if (!user.features.includes('read:appointment:others')) {
  where.specialist = { id: user.id };
}
```

---

## Matriz de acesso padrão por perfil

| Ação                    | Admin | Member | Specialist | Patient          |
| ----------------------- | :---: | :----: | :--------: | :--------------: |
| Gerenciar usuários      |  Sim  |  Sim   |  Próprio   |      Próprio      |
| Listar pacientes        |  Sim  |  Sim   |    Não     |       Não         |
| Visualizar paciente     |  Sim  |  Sim   |    Não     |      Próprio      |
| Editar paciente         |  Sim  |  Sim   |    Não     |      Próprio      |
| Criar atendimento       |  Sim  |  Não   |    Sim     |       Não         |
| Listar atendimentos     |  Sim  |  Sim   |    Sim     |      Próprio      |
| Editar atendimento      |  Sim  |  Não   |   Próprio   |       Não         |
| Cancelar atendimento    |  Sim  |  Não   |   Próprio   |       Não         |
| Criar encaminhamento    |  Sim  |  Não   |    Não     |       Não         |
| Listar encaminhamentos  |  Sim  |  Sim   |    Sim     |      Próprio      |
| Editar encaminhamento   |  Sim  |  Não   |   Próprio   |       Não         |
| Gerenciar convites      |  Sim  |  Sim   |    Não     |       Não         |
| Visualizar estatísticas |  Sim  |  Sim   |    Sim     |       Não         |
| Gerenciar catalogações  |  Sim  |  Sim   |    Não     |      Próprio      |
