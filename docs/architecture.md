# Arquitetura do sistema

## Visão geral

O ABNMO Backend é uma API SaaS construída com **NestJS** para gerenciar pacientes, usuários, atendimentos, encaminhamentos e dados de saúde relacionados à Neuromielite Óptica.

## Stack

| Tecnologia | Finalidade |
|---|---|
| NestJS + TypeScript | Framework principal |
| TypeORM + MySQL | Persistência de dados |
| Zod | Validação de schemas e DTOs |
| JWT (cookies HTTP-only) | Autenticação |
| nestjs-pino | Logging estruturado |
| AWS SES / Resend | Envio de e-mails |

## Estrutura de pastas

```
src/
├── app/
│   ├── app.module.ts              # Módulo raiz — wiring de tudo
│   ├── app.ts                     # Criação do app NestJS
│   ├── main.ts                    # Bootstrap (HTTP)
│   ├── lambda.ts                  # Bootstrap (AWS Lambda)
│   ├── cryptography/              # Módulo compartilhado: hash e JWT
│   ├── database/                  # Módulo de conexão TypeORM
│   ├── http/                      # Módulos de funcionalidade (features)
│   │   ├── appointments/
│   │   ├── auth/
│   │   ├── patient-requirements/
│   │   ├── patient-supports/
│   │   ├── patients/
│   │   ├── referrals/
│   │   ├── statistics/
│   │   └── users/
│   └── mail/                      # Módulo de envio de e-mail
├── common/                        # Utilitários e abstrações globais
│   ├── context/                   # AsyncLocalStorage por request
│   ├── decorators/                # @Public, @Roles, @User, @Cookies
│   ├── guards/                    # AuthGuard, RolesGuard
│   ├── log/                       # AppLogger, @Logger, LogModule
│   ├── dtos.ts                    # BaseResponse
│   ├── http.exception.filter.ts   # Filtro global de exceções
│   ├── types.d.ts                 # AuthUser, ContextEvent
│   └── zod.validation.pipe.ts     # GlobalZodValidationPipe
├── config/                        # Configurações TypeORM / database
├── constants/                     # Estados brasileiros, regex
├── domain/                        # Camada de domínio pura
│   ├── entities/                  # Entidades TypeORM
│   ├── enums/                     # Constantes e tipos
│   └── schemas/                   # Schemas Zod
├── env/                           # Validação e acesso a variáveis de ambiente
└── utils/                         # Utilitários funcionais (sem DI)
```

## Padrão arquitetural

Cada feature HTTP segue um padrão **MVC + Use Cases**:

```
feature/
├── feature.module.ts       # Registra entidades, controllers e use-cases
├── feature.controller.ts   # Recebe requisições e delega para use-cases
├── feature.dtos.ts         # DTOs derivados dos schemas Zod
└── use-cases/
    └── action-feature.use-case.ts
```

Os controllers **não contêm lógica de negócio** — apenas chamam `useCase.execute()` e retornam a resposta formatada. Toda lógica vive nos use-cases.

## Módulo raiz (`AppModule`)

O `AppModule` orquestra toda a aplicação:

```typescript
@Module({
  imports: [
    ConfigModule.forRoot({ validate: (env) => envSchema.parse(env) }),
    EnvModule,
    LoggerModule.forRootAsync(...),  // nestjs-pino
    LogModule,                       // AppLogger (global)
    DatabaseModule,                  // TypeORM connection
    AuthModule,                      // registra AuthGuard e RolesGuard globalmente
    UsersModule,
    PatientsModule,
    ReferralsModule,
    AppointmentsModule,
    StatisticsModule,
    PatientRequirementsModule,
    PatientSupportsModule,
  ],
  providers: [HttpExceptionFilter],  // filtro global de exceções
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(ContextMiddleware, MaintenanceMiddleware).forRoutes('*');
  }
}
```

## Fluxo de uma requisição

```
Requisição HTTP
  → ContextMiddleware       (inicializa AsyncLocalStorage)
  → AuthGuard               (valida access_token ou faz silent refresh)
  → RolesGuard              (verifica @Roles no handler)
  → GlobalZodValidationPipe (valida DTOs com Zod)
  → Controller              (extrai parâmetros e chama use-case)
  → UseCase                 (lógica de negócio, acesso ao banco)
  → Controller              (formata e retorna resposta)
```

Em caso de exceção em qualquer etapa, o `HttpExceptionFilter` captura e retorna uma resposta padronizada.

## Módulos compartilhados

Alguns módulos não são features HTTP, mas fornecem serviços internos reutilizáveis:

| Módulo | Propósito | Como importar |
|---|---|---|
| `CryptographyModule` | Hash (bcrypt), criação/verificação de JWT e manipulação de cookies | Importar explicitamente no módulo que precisar |
| `MailModule` | Envio de e-mails (SES/Resend) | Importar explicitamente no módulo que precisar |
| `LogModule` | `AppLogger` e `ContextService` | Global — não precisa importar |
| `EnvModule` | Acesso tipado a variáveis de ambiente | Importar explicitamente quando necessário |

> `LogModule` é declarado com `@Global()`, portanto `AppLogger` está disponível em toda a aplicação sem ser importado individualmente.
