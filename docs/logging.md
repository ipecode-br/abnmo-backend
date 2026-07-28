# Logging

## Visão geral

O sistema de logging usa `nestjs-pino` como base e expõe o `LogService`, que enriquece cada log com contexto da requisição atual (evento, usuário) via `AsyncLocalStorage`.

`LogModule` é global — `LogService` está disponível em qualquer classe sem importação explícita do módulo.

---

## `LogService`

Injetável em qualquer classe que esteja no contexto de injeção do NestJS.

### Métodos

| Método                    | Nível | Uso                                    |
| ------------------------- | ----- | -------------------------------------- |
| `log(message, extras?)`   | info  | Operações de sucesso                   |
| `info(message, extras?)`  | info  | Alias de `log`                         |
| `warn(message, extras?)`  | warn  | Situações inesperadas mas não críticas |
| `error(message, extras?)` | error | Erros e exceções                       |
| `debug(message, extras?)` | debug | Informações de diagnóstico             |

### Uso

```typescript
constructor(private readonly logger: LogService) {}

// Em use-cases
this.logger.log('Appointment created', {
  appointmentId: appointment.id,
  patientId,
});

this.logger.error('Create appointment failed: patient not found', {
  patientId,
});

this.logger.warn('Cancel appointment failed: already canceled', { id });
```

---

## Payload automático

Cada log é enriquecido automaticamente com contexto da requisição:

```json
{
  "level": "info",
  "event": "create_appointment",
  "user": { "id": "...", "email": "...", "role": "member" },
  "...": "..."
}
```

Os campos `event` e `user` são populados automaticamente pelo `ContextService` a partir dos decorators e guards — não precisam ser passados manualmente.

---

## Decorator `@Log()`

O `@Log` é um decorator que funciona em dois níveis:

### Class-level (use-cases)

Aplicado na classe, intercepta todos os métodos e define o contexto do logger como o nome da classe:

```typescript
@Log()
@Injectable()
export class CreateAppointmentUseCase {
  constructor(private readonly logger: LogService) {}

  async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
    // logger.setContext('CreateAppointmentUseCase') chamado automaticamente
    this.logger.log('Appointment created', { appointmentId });
  }
}
```

### Method-level (controllers)

Aplicado em métodos do controller, registra o evento auditável para toda a requisição:

```typescript
@Post()
@Log('create_appointment')
@RequireFeature('create:appointment')
@ZodResponse({ type: BaseResponse, status: 201 })
async create(@User() user: RequestUser, @Body() body: CreateAppointmentBody) {
  // Todos os logs desta requisição terão "event": "create_appointment"
}
```

### Eventos disponíveis (`ContextEvent`)

| Domínio         | Eventos                                                                                       |
| --------------- | --------------------------------------------------------------------------------------------- |
| Atendimentos    | `create_appointment`, `update_appointment`, `cancel_appointment`                              |
| Autenticação    | `sign_in`, `logout`, `register_user`, `recover_password`, `reset_password`, `change_password` |
| Encaminhamentos | `create_referral`, `update_referral`, `cancel_referral`                                       |
| Pacientes       | `create_patient`, `update_patient`, `deactivate_patient`                                      |
| Requisitos      | `create_patient_requirement`, `approve_patient_requirement`, `decline_patient_requirement`    |
| Suporte         | `create_patient_support`, `update_patient_support`, `delete_patient_support`                  |
| Usuários        | `create_user_invite`, `delete_user_invite`, `update_user`, `activate_user`, `deactivate_user` |
| Catálogos       | `init_survey`, `complete_survey`, `approve_survey`, `decline_survey`, `send_survey_reminder`  |
| Status          | `get_status`                                                                                  |
| Webhooks        | `signature_survey_webhook`                                                                    |

---

## Integração com Sentry

Quando configurado (`SENTRY_DSN` preenchido), o `LogService` encaminha logs para o Sentry paralelamente ao pino. O nível de envio é controlado pela variável `SENTRY_LOGS`:

| `SENTRY_LOGS` | Comportamento                                                   |
| ------------- | --------------------------------------------------------------- |
| `"none"`      | Nenhum log enviado ao Sentry                                    |
| `"error"`     | Apenas chamadas de `logger.error()` são encaminhadas            |
| `"all"`       | Todos os níveis (`info`, `warn`, `error`, `debug`) são enviados |

Os logs enviados ao Sentry incluem o mesmo payload enriquecido do pino (`event`, `user`, `context`), tornando-os pesquisáveis no dashboard do Sentry.

Para filtrar logs 4xx no Sentry (evitar poluição), o `instrument.ts` inclui um `beforeSendLog` que descarta logs com `status < 500`. Apenas erros 5xx e logs sem status HTTP chegam ao Sentry.

---

## Padrão completo

```typescript
// Controller
@Post()
@Log('create_appointment')         // registra o evento
@RequireFeature('create:appointment')
@ZodResponse({ type: BaseResponse, status: 201 })
async create(@User() user: RequestUser, @Body() body: CreateAppointmentBody) {
  await this.createAppointmentUseCase.execute({ user, ...body });
  return { success: true, message: 'Atendimento cadastrado com sucesso.' };
}

// Use-case
@Log()                              // contexto = 'CreateAppointmentUseCase'
@Injectable()
export class CreateAppointmentUseCase {
  constructor(private readonly logger: LogService) {}

  async execute(input: CreateAppointmentUseCaseInput): Promise<void> {
    const patient = await this.patientsRepository.findOne({ where: { id: input.patientId } });

    if (!patient) {
      this.logger.error('Create appointment failed: patient not found', { patientId: input.patientId });
      throw new NotFoundException('Paciente não encontrado.', {
        cause: `Patient with ID <${input.patientId}> not found`,
      });
    }

    const appointment = this.appointmentsRepository.create({ ... });
    await this.appointmentsRepository.save(appointment);

    this.logger.log('Appointment created', {
      appointmentId: appointment.id,
      patientId: input.patientId,
    });
  }
}
```

---

## Regras

- Use `@Log()` em todos os use-cases (class-level).
- Use `@Log('event_name')` em todos os controllers para endpoints de mutação.
- Mensagens de log em **inglês** — são para desenvolvedores, não para o usuário.
- Inclua metadados relevantes no segundo argumento para facilitar rastreamento.
- Use `logger.error()` antes de lançar exceções que representam falhas operacionais.
- **Nunca** logar senhas, tokens ou dados sensíveis.
