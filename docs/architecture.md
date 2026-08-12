# Arquitetura do sistema

## Visão geral

API SaaS construída com **NestJS** para gerenciamento de pacientes, usuários, atendimentos, encaminhamentos e dados de saúde relacionados à Neuromielite Óptica.

## Stack

| Tecnologia              | Finalidade                                   |
| ----------------------- | -------------------------------------------- |
| NestJS + TypeScript     | Framework principal                          |
| TypeORM + PostgreSQL    | Persistência de dados                        |
| Zod v4                  | Validação de schemas e DTOs                  |
| JWT (cookies HTTP-only) | Autenticação                                 |
| nestjs-pino             | Base do sistema de logging                   |
| @sentry/nestjs          | Monitoramento de erros 5xx e logs            |
| AWS SQS + Lambda        | Enfileiramento e envio assíncrono de e-mails |
| LocalStack (dev)        | Simulação de SQS em desenvolvimento          |
| Docker                  | Banco de dados local                         |

## Estrutura de pastas

```
src/
├── app/
│   ├── app.module.ts              # Módulo raiz
│   ├── app.ts                     # Factory createNestApp()
│   ├── main.ts                    # Bootstrap (HTTP — dev local)
│   ├── lambda.ts                  # Bootstrap (AWS Lambda)
│   ├── cryptography/              # Módulo compartilhado: hash, JWT e cookies
│   ├── database/                  # Configuração do TypeORM
│   ├── http/                      # Módulos de funcionalidade
│   │   ├── appointments/
│   │   ├── auth/
│   │   ├── patient-requirements/
│   │   ├── patients/
│   │   ├── referrals/
│   │   ├── statistics/
│   │   ├── status/
│   │   ├── surveys/
│   │   │   └── submissions/
│   │   ├── users/
│   │   └── webhooks/
│   ├── queue/                     # Módulo global de SQS (EnqueueEmailUseCase, etc.)
│   ├── signature/                 # Módulo de assinatura digital
│   └── storage/                   # Módulo de upload de arquivos (S3/CDN)
├── shared/                        # Código compartilhado entre API e workers
│   └── queue/                     # Contratos (envelope, DTOs) de mensagens SQS
├── workers/                       # Workers (AWS Lambda)
│   └── email/                     # Worker de e-mail (consumer SQS → SES/Resend)
│       ├── handler.ts             # createQueueWorkerHandler(...)
│       ├── logger.ts              # createQueueWorkerLogger('email', env.SENTRY_LOGS)
│       ├── sentry.ts              # Sentry.init() no cold start
│       ├── env.ts                 # Zod schema + parse(process.env)
│       ├── send-email.ts          # Dispatch por template + provider
│       ├── providers/             # Implementações SES e Resend
│       └── templates/             # Builders de templates de e-mail
├── common/                        # Utilitários globais
│   ├── authorization/             # `can()` — verificação de permissões
│   ├── context/                   # AsyncLocalStorage por request
│   ├── decorators/                # @Public, @RequireFeature, @User, @Cookies
│   ├── guards/                    # AuthGuard, FeatureGuard
│   ├── log/                       # LogService, @Log, LogModule
│   ├── middlewares/               # Maintenance, Signature, Context
│   ├── dtos.ts                    # BaseResponse
│   ├── http-exception.filter.ts   # Filtro global de exceções (+ Sentry)
│   └── types.d.ts                 # RequestUser, ContextUser, ContextEvent
├── config/                        # Configuração da aplicação
├── constants/                     # Estados brasileiros, regex
├── domain/                        # Camada de domínio
│   ├── entities/                  # Entidades TypeORM (todas estendem BaseEntity)
│   ├── enums/                     # Constantes `as const` + tipos derivados
│   └── schemas/                   # Schemas Zod (entidade, request, response)
├── env/                           # Validação e acesso a variáveis de ambiente
├── instrument.ts                  # Inicialização do Sentry
└── utils/                         # Utilitários funcionais (sem DI)
```

## Padrão arquitetural

Cada feature HTTP segue o padrão **MVC + Use Cases**:

```
feature/
├── feature.module.ts       # Registra entidades, controllers e use-cases
├── feature.controller.ts   # Recebe requisições, delega para use-cases
├── feature.dtos.ts         # DTOs derivados dos schemas Zod
└── use-cases/
    └── action-feature.use-case.ts  # Um por ação
```

Controllers não contêm lógica de negócio — apenas chamam `useCase.execute()` e formatam a resposta.

## Módulo raiz (`AppModule`)

```typescript
@Module({
  imports: [
    SentryModule.forRoot(),
    LogModule,
    QueueModule,
    DatabaseModule,
    AuthModule,
    AppointmentsModule,
    PatientsModule,
    PatientRequirementsModule,
    ReferralsModule,
    StatisticsModule,
    StatusModule,
    StorageModule,
    SurveysModule,
    UsersModule,
    WebhooksModule,
  ],
  providers: [
    { provide: APP_GUARD, useClass: LogGuard },
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
    { provide: APP_INTERCEPTOR, useClass: ZodSerializerInterceptor },
  ],
})
export class AppModule {}
```

## Fluxo de uma requisição

```
Requisição HTTP
  → ContextMiddleware        (inicializa AsyncLocalStorage)
  → MaintenanceMiddleware    (bloqueia requisições em modo manutenção)
  → AuthGuard                (valida token JWT nos cookies — exceto @Public())
  → FeatureGuard             (verifica @RequireFeature no handler)
  → Controller               (extrai parâmetros, chama use-case)
  → UseCase                  (lógica de negócio com can(), banco de dados)
  → ZodSerializerInterceptor (serializa e valida resposta contra schema Zod)
```

Em caso de exceção, o `HttpExceptionFilter` captura, reporta ao Sentry (5xx) e retorna resposta padronizada.

## Workers (AWS Lambda + SQS)

Workers são funções Lambda consumidoras de filas SQS, construídas com o builder `createQueueWorkerHandler` (`src/shared/queue/create-handler.ts`). O builder encapsula:

- Parsing e validação do envelope (`messageEnvelopeSchema`)
- Deduplicação de mensagens via `idempotencyKey` (batch-level + cross-batch)
- Classificação de erros (`ZodError`/`SyntaxError`/`TypeError` → Sentry imediato + delete; erro transiente → retry; última tentativa → Sentry + DLQ)
- Acumulação de `batchItemFailures` para reporte parcial ao SQS
- Logging via `console` + Sentry (`createQueueWorkerLogger`)

### Fluxo de envio de e-mail

```
UseCase (API)
  → EnqueueEmailUseCase.execute({ template, to, ... })
  → SQS (fila email-queue)
  → Worker Lambda (handler.ts)
    → createQueueWorkerHandler configura dedup, logging e parse
    → onProcess(job) → sendEmail(job)
    → build*Email(job) → EMAIL_PROVIDER=ses|resend → SES ou Resend
```

### Estrutura de um worker

```
src/workers/{name}/
  handler.ts            # createQueueWorkerHandler({ name, maxReceiveCount, parsePayload }, { onProcess, logger })
  env.ts                # Zod schema com maxReceiveCount, SENTRY_LOGS, configs específicas
  logger.ts             # createQueueWorkerLogger(name, env.SENTRY_LOGS)
  sentry.ts             # Sentry.init() no cold start
```

### Criando um novo worker

Veja [`docs/workers.md`](workers.md) para o guia completo de criação de workers.

### Infraestrutura compartilhada

| Arquivo (`src/shared/queue/`) | Propósito                                                                             |
| ----------------------------- | ------------------------------------------------------------------------------------- |
| `create-handler.ts`           | Builder `createQueueWorkerHandler` e tipos `QueueWorkerConfig`/`QueueWorkerCallbacks` |
| `logger.ts`                   | Factory `createQueueWorkerLogger` e interface `QueueWorkerLogger`                     |
| `envelope.ts`                 | `messageEnvelopeSchema` — envelope versionado com `idempotencyKey`                    |
| `email.dto.ts`                | `sendEmailJobSchema` (discriminated union) e `parseEmailMessage()`                    |
| `utils.ts`                    | `generateQueueIdempotencyKey`, `checkIsProcessed`, `markProcessed`                    |

## Módulos compartilhados

| Módulo               | Propósito                                   | Como importar                   |
| -------------------- | ------------------------------------------- | ------------------------------- |
| `CryptographyModule` | Hash (bcrypt), JWT e cookies                | Importar no módulo que precisar |
| `QueueModule`        | `EnqueueEmailUseCase` — enfileiramento SQS  | Global — não precisa importar   |
| `EnvModule`          | Acesso tipado a variáveis de ambiente       | Global — não precisa importar   |
| `StorageModule`      | Upload de arquivos (S3/CDN com signed URLs) | Importar quando necessário      |
| `SignatureModule`    | Assinatura digital (ClickSign)              | Importar no módulo que precisar |
| `LogModule`          | `LogService` e decorator `@Log()`           | Global — não precisa importar   |
| `SentryModule`       | Monitoramento de erros e logs               | Registrado no `AppModule`       |

> `LogModule`, `QueueModule` e `EnvModule` são declarados com `@Global()`, portanto `LogService`, `EnqueueEmailUseCase` e `EnvService` estão disponíveis em toda a aplicação.
