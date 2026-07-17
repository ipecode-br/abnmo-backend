# Arquitetura do sistema

## Visão geral

API SaaS construída com **NestJS** para gerenciamento de pacientes, usuários, atendimentos, encaminhamentos e dados de saúde relacionados à Neuromielite Óptica.

## Stack

| Tecnologia              | Finalidade                  |
| ----------------------- | --------------------------- |
| NestJS + TypeScript     | Framework principal         |
| TypeORM + PostgreSQL    | Persistência de dados       |
| Zod v4                  | Validação de schemas e DTOs |
| JWT (cookies HTTP-only) | Autenticação                |
| nestjs-pino             | Base do sistema de logging  |
| AWS SES / Resend        | Envio de e-mails            |
| Docker                  | Banco de dados local        |

## Estrutura de pastas

```
src/
├── app/
│   ├── app.module.ts              # Módulo raiz
│   ├── main.ts                    # Bootstrap (HTTP)
│   ├── lambda.ts                  # Bootstrap (AWS Lambda)
│   ├── cryptography/              # Módulo compartilhado: hash, JWT e cookies
│   ├── http/                      # Módulos de funcionalidade
│   │   ├── appointments/
│   │   ├── auth/
│   │   ├── patient-requirements/
│   │   ├── patients/
│   │   ├── referrals/
│   │   ├── statistics/
│   │   ├── storage/
│   │   ├── surveys/
│   │   │   └── submissions/
│   │   └── users/
│   ├── mail/                      # Módulo de envio de e-mail
│   └── storage/                   # Módulo de upload de arquivos (S3/CDN)
├── common/                        # Utilitários globais
│   ├── authorization/             # `can()` — verificação de permissões
│   ├── context/                   # AsyncLocalStorage por request
│   ├── decorators/                # @Public, @Roles, @RequireFeature, @User, @Cookies
│   ├── guards/                    # AuthGuard, RolesGuard, FeatureGuard
│   ├── log/                       # LogService, @Log, LogModule
│   ├── dtos.ts                    # BaseResponse
│   ├── http-exception.filter.ts   # Filtro global de exceções
│   └── types.d.ts                 # RequestUser, ContextUser, ContextEvent
├── config/                        # Configuração da aplicação
├── constants/                     # Estados brasileiros, regex
├── domain/                        # Camada de domínio
│   ├── entities/                  # Entidades TypeORM (todas estendem BaseEntity)
│   ├── enums/                     # Constantes `as const` + tipos derivados
│   └── schemas/                   # Schemas Zod (entidade, request, response)
├── env/                           # Validação e acesso a variáveis de ambiente
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
    EnvModule,
    AuthModule,
    AppointmentsModule,
    PatientsModule,
    PatientRequirementsModule,
    ReferralsModule,
    StatisticsModule,
    StorageModule,
    SurveysModule,
    SurveySubmissionsModule,
    UsersModule,
  ],
  providers: [HttpExceptionFilter],
})
export class AppModule {}
```

## Fluxo de uma requisição

```
Requisição HTTP
  → ContextMiddleware       (inicializa AsyncLocalStorage)
  → AuthGuard               (valida token JWT nos cookies)
  → RolesGuard              (verifica @Roles no handler — admin bypass)
  → FeatureGuard            (verifica @RequireFeature no handler)
  → Controller              (extrai parâmetros, chama use-case)
  → UseCase                 (lógica de negócio com can(), banco de dados)
  → ZodSerializerInterceptor(serializa e valida resposta contra schema Zod)
```

Em caso de exceção, o `HttpExceptionFilter` captura e retorna resposta padronizada.

## Módulos compartilhados

| Módulo               | Propósito                                        | Como importar                  |
| -------------------- | ------------------------------------------------ | ------------------------------ |
| `CryptographyModule` | Hash (bcrypt), JWT e cookies                     | Importar no módulo que precisar |
| `MailModule`         | Envio de e-mails (SES/Resend)                    | Importar no módulo que precisar |
| `EnvModule`          | Acesso tipado a variáveis de ambiente            | Importar quando necessário      |
| `StorageModule`      | Upload de arquivos (S3/CDN com signed URLs)      | Importar quando necessário      |
| `LogModule`          | `LogService` e decorator `@Log()`                | Global — não precisa importar   |

> `LogModule` é declarado com `@Global()`, portanto `LogService` está disponível em toda a aplicação.
