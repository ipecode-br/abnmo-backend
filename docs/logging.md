# Logging

## Visão geral

O sistema de logging usa `nestjs-pino` como base e expõe um serviço `AppLogger` que enriquece cada log com contexto da requisição atual (evento, usuário autenticado) via `AsyncLocalStorage`.

---

## `AppLogger`

O `AppLogger` é o único serviço de log a ser usado na aplicação. Injetável em qualquer classe que esteja no contexto do `LogModule` (que é global).

### Métodos

| Método | Nível | Uso |
|---|---|---|
| `log(message, extras?)` | info | Operações de sucesso |
| `info(message, extras?)` | info | Alias de `log` |
| `warn(message, extras?)` | warn | Situações inesperadas mas não críticas |
| `error(message, extras?)` | error | Erros e exceções |
| `debug(message, extras?)` | debug | Informações de diagnóstico |

Todos os métodos aceitam um segundo argumento de metadados extras que são mesclados ao contexto:

```typescript
this.logger.log('Appointment created successfully', {
  patientId,
  appointmentId: appointment.id,
  createdBy: user.id,
});
```

### Payload automático

Cada log é enriquecido automaticamente com:

```json
{
  "level": "info",
  "msg": "Appointment created successfully",
  "event": "create_appointment",
  "authUser": { "id": "...", "email": "...", "role": "nurse" },
  "patientId": "...",
  "appointmentId": "...",
  "createdBy": "..."
}
```

Os campos `event` e `authUser` vêm do `ContextService` — são definidos automaticamente pelo `AuthGuard` e pelo use-case, sem necessidade de passá-los manualmente.

---

## Decorator `@Logger()`

O decorator `@Logger()` é um class decorator aplicado em use-cases. Ele intercepta o método `execute()` e injeta o nome da classe como contexto do logger antes de cada execução:

```typescript
@Logger()
@Injectable()
export class CreateAppointmentUseCase {
  constructor(private readonly logger: AppLogger) {}

  async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
    // logger.setContext('CreateAppointmentUseCase') é chamado automaticamente
    this.logger.setEvent('create_appointment');
    // ...
  }
}
```

O decorator deve sempre vir **antes** de `@Injectable()`. Quando o `AppLogger` não está disponível no construtor (ex: use-case sem logging), o decorator não tem efeito.

---

## `setEvent()`

Todo use-case deve chamar `this.logger.setEvent()` como **primeira linha** do `execute()`. Isso associa todos os logs daquela execução a um evento tipado, visível nos logs estruturados:

```typescript
async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
  this.logger.setEvent('create_appointment');
  // todos os logs abaixo terão "event": "create_appointment"
}
```

### Eventos disponíveis (`ContextEvent`)

Os eventos são tipados como uma union em `src/common/types.d.ts`:

| Domínio | Eventos |
|---|---|
| Atendimentos | `create_appointment`, `update_appointment`, `cancel_appointment` |
| Autenticação | `sign_in`, `logout`, `register_patient`, `register_user`, `recover_password`, `reset_password`, `refresh_token`, `change_password` |
| Encaminhamentos | `create_referral`, `update_referral`, `cancel_referral` |
| Pacientes | `create_patient`, `update_patient`, `deactivate_patient` |
| Requisitos de paciente | `create_patient_requirement`, `approve_patient_requirement`, `decline_patient_requirement` |
| Contatos de apoio | `create_patient_support`, `update_patient_support`, `delete_patient_support` |
| Usuários | `create_user_invite`, `cancel_user_invite`, `update_user`, `activate_user`, `deactivate_user` |

---

## Padrão completo de uso em use-cases

```typescript
@Logger()
@Injectable()
export class CreatePatientUseCase {
  constructor(
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
    private readonly logger: AppLogger,
  ) {}

  async execute(input: CreatePatientUseCaseInput): Promise<void> {
    this.logger.setEvent('create_patient');

    const existing = await this.patientsRepository.findOne({
      select: { id: true },
      where: { email: input.email },
    });

    if (existing) {
      this.logger.error('Create patient failed: email already registered', {
        email: input.email,
      });
      throw new ConflictException('Já existe um paciente com este e-mail.');
    }

    const patient = await this.patientsRepository.save({ ...input });

    this.logger.log('Patient created successfully', {
      patientId: patient.id,
      createdBy: input.user.id,
    });
  }
}
```

---

## Regras

- Use `@Logger()` em todos os use-cases que possuem `AppLogger` no construtor.
- Chame `this.logger.setEvent()` **sempre** como primeira linha do `execute()`.
- Mensagens de log em **inglês** (são para desenvolvedores, não para o usuário).
- Inclua metadados relevantes no segundo argumento (`patientId`, `userId`, `email`, etc.) para facilitar rastreamento.
- Use `logger.error()` antes de lançar exceções que representam falhas operacionais (conflitos, entidades não encontradas por dados inválidos).
- Nunca logar senhas, tokens ou dados sensíveis.
