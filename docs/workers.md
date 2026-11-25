# Workers

## Visão geral

Workers são funções AWS Lambda consumidoras de filas SQS, construídas com o builder `createQueueWorkerHandler`. O builder encapsula a lógica repetitiva — envelope parsing, deduplicação, classificação de erros, logging e reporte ao Sentry — deixando cada worker focado apenas na sua lógica de negócio.

Exceção: workers que consomem eventos de terceiros via SNS (como o `events`) têm handler próprio, porque o formato da mensagem não é o envelope interno. Veja [Workers de eventos externos](#workers-de-eventos-externos-sns--sqs).

---

## `createQueueWorkerHandler`

```ts
import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import type {
  QueueWorkerConfig,
  QueueWorkerCallbacks,
} from '@/shared/queue/create-handler';
```

### `QueueWorkerConfig`

| Campo             | Tipo                            | Descrição                                                   |
| ----------------- | ------------------------------- | ----------------------------------------------------------- |
| `name`            | `string`                        | Nome do worker (usado em logs e tags do Sentry)             |
| `maxReceiveCount` | `number`                        | Limiar de tentativas para alerta no Sentry e envio para DLQ |
| `parsePayload`    | `(payload: unknown) => unknown` | Função Zod para validar o payload específico do worker      |
| `dedupTtlMs?`     | `number`                        | TTL da janela de deduplicação (default: 10 minutos)         |

### `QueueWorkerCallbacks`

| Campo       | Tipo                                                 | Descrição                                                |
| ----------- | ---------------------------------------------------- | -------------------------------------------------------- |
| `onProcess` | `(job: unknown, messageId: string) => Promise<void>` | Lógica de negócio do worker                              |
| `logger`    | `QueueWorkerLogger`                                  | Instância de logger criada via `createQueueWorkerLogger` |

### O que o builder faz automaticamente

1. **Parsing do envelope** — valida `{ version, type, idempotencyKey, payload }` com Zod
2. **Deduplicação** — checa `idempotencyKey` contra cache em memória (batch-level + cross-batch)
3. **Logging** — `info` ao processar/pular mensagem, `error` em falhas (via `logger`)
4. **Classificação de erros**:
   - `ZodError`, `SyntaxError` ou `TypeError` (erros permanentes) → reporta ao Sentry
     **imediatamente** com o corpo completo da mensagem no extra `body` para debugging.
     A mensagem é **removida da fila** — não vai para `batchItemFailures` e não é retentada.
   - Erro transiente com `receiveCount >= maxReceiveCount` → reporta ao Sentry
     (última tentativa, mensagem vai para DLQ)
   - Erro transiente com `receiveCount < maxReceiveCount` → **não** reporta ao Sentry,
     retorna em `batchItemFailures` para retry pelo SQS
5. **Batch failures** — acumula `messageId`s com falha e retorna `{ batchItemFailures }`

---

## Logger (`createQueueWorkerLogger`)

```ts
import { createQueueWorkerLogger } from '@/shared/queue/logger';
```

Cada worker cria seu logger com nome e nível de Sentry:

```ts
// src/workers/my-worker/logger.ts
import { createQueueWorkerLogger } from '@/shared/queue/logger';
import { env } from './env';

export const logger = createQueueWorkerLogger('my-worker', env.SENTRY_LOGS);
```

O logger escreve em `console.info`/`console.error` e, quando configurado, encaminha para `Sentry.logger`. A interface `QueueWorkerLogger` expõe apenas `info` e `error`.

---

## Envelope e deduplicação

Toda mensagem na fila SQS segue o formato:

```ts
{
  version: 1,
  type: 'email',
  idempotencyKey: 'uuid-v7',
  payload: { /* worker-specific */ }
}
```

No produtor (API), o `idempotencyKey` é gerado via `generateQueueIdempotencyKey()` a partir de `src/shared/queue/utils.ts`.

No consumidor (worker), o builder usa `checkIsProcessed`/`markProcessed` para evitar duplicatas. A deduplicação opera em dois níveis:

- **Batch-level**: um `Set<string>` de `messageId` por invocação (cobre double-read por visibility timeout)
- **Cross-batch**: um `Map<string, number>` com TTL de 10 minutos (cobre entregas duplicadas do SQS)

---

## Workers de eventos externos (SNS → SQS)

O worker `events` (`src/workers/events/`) não usa `createQueueWorkerHandler`: a fila recebe o envelope do SNS (`Type`, `MessageId`, `TopicArn`, `Message`) e o conteúdo é um evento de terceiros (WhatsApp/Meta), não o envelope interno `{ version, type, idempotencyKey, payload }`. Use esse padrão para qualquer fila alimentada por eventos de terceiros.

- **Sem Zod para o payload externo** — o formato é definido por terceiros e pode mudar sem aviso. Os payloads são tipados em `types.ts` e convertidos com `as`; o único parsing rígido é o `JSON.parse` do envelope SNS e do `whatsAppWebhookEntry` (string JSON).
- **Roteamento por emissor** — `sources/index.ts` resolve a fonte pelo `TopicArn` (quando `SNS_TOPIC_ARN_WHATSAPP` está definido) e, como fallback, pelo formato do payload. Para um novo emissor, crie `sources/<nome>.ts` e registre em `eventSources`.
- **Classificação de erros** — `SyntaxError`, `TypeError` e `UnknownEventSourceError` são permanentes: reporta ao Sentry e **descarta a mensagem sem retry**. Erros transientes voltam em `batchItemFailures` e só são reportados ao Sentry na última tentativa (`SQS_EVENTS_MAX_RECEIVE_COUNT`).
- **Emissores desconhecidos são descartados** — publicar em um tópico novo antes de implementar o `source` correspondente perde os eventos (um issue no Sentry por mensagem). Faça deploy do source antes de assinar o tópico.
- **`SQS_EVENTS_MAX_RECEIVE_COUNT` deve acompanhar o `max_receive_count` da fila** (`abnmo-devops`, módulo `queue`). Se o DLQ for configurado com um valor menor, o alerta de última tentativa nunca dispara.
- **`raw_message_delivery` permanece `false`** na subscription SNS → SQS: o worker espera o envelope SNS, não o payload cru.
- **Destinatário mascarado + `userId`** — os logs e o extra do Sentry do worker `events` registram o telefone do destinatário mascarado (ex.: `+554799***99`) e o `userId` retornado em `biz_opaque_callback_data`; nunca o `recipient_id` cru. O worker `whatsapp` envia o `userId` do paciente como `biz_opaque_callback_data` (limite de 512 caracteres do Meta). Para obter o telefone completo, consulte o `User` pelo `userId`. Mensagens sem esse campo não têm como ser correlacionadas ao usuário.
- **Corpos de erro sanitizados** — os extras `body` capturados em erros permanentes passam por `sanitizeBodyForSentry`, que mascara telefones e anonimiza dados pessoais antes de enviar ao Sentry.

---

## Criando um novo worker

### 1. Criar a estrutura de pastas

```
src/workers/my-worker/
  handler.ts
  env.ts
  logger.ts
  sentry.ts
```

### 2. Configurar ambiente (`env.ts`)

```ts
import 'dotenv/config';
import { z } from 'zod';

export const myWorkerEnvSchema = z.object({
  SQS_MY_WORKER_MAX_RECEIVE_COUNT: z.coerce.number().default(5),
  SENTRY_DSN: z.string().optional().default(''),
  SENTRY_LOGS: z.enum(['all', 'error', 'none']).default('none'),
});

export const env = myWorkerEnvSchema.parse(process.env);
```

### 3. Criar o logger (`logger.ts`)

```ts
import { createQueueWorkerLogger } from '@/shared/queue/logger';
import { env } from './env';

export const logger = createQueueWorkerLogger('my-worker', env.SENTRY_LOGS);
```

### 4. Inicializar Sentry (`sentry.ts`)

```ts
import * as Sentry from '@sentry/node';
import { getSentryConfig } from '@/shared/sentry';
import { env } from './env';

const config = getSentryConfig({
  dsn: env.SENTRY_DSN,
  sentryLogs: env.SENTRY_LOGS,
  component: 'my-worker',
  environment: process.env.NODE_ENV,
});

if (config) Sentry.init(config);
```

### 5. Criar o DTO da mensagem em `src/shared/queue/schemas/`

```ts
// src/shared/queue/schemas/my-worker.ts
import { z } from 'zod';

export const myMessageSchema = z.object({
  type: z.literal('my-message'),
  to: z.string().email(),
  body: z.string().min(1),
});

export type MyMessage = z.infer<typeof myMessageSchema>;

export function parseMyMessage(message: unknown): MyMessage {
  return myMessageSchema.parse(message);
}
```

### 6. Adicionar o `type` ao envelope

```ts
// src/shared/queue/envelope.ts
export const messageEnvelopeSchema = z.object({
  version: z.literal(1),
  type: z.enum(['email', 'whatsapp', 'my-message']), // adicionar novo tipo
  payload: z.unknown(),
  idempotencyKey: z.uuid(),
});
```

### 7. Criar o handler (`handler.ts`)

```ts
import './sentry';
import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import { parseMyMessage } from '@/shared/queue/schemas/my-worker';
import { env } from './env';
import { logger } from './logger';

export const handler = createQueueWorkerHandler(
  {
    name: 'my-worker',
    maxReceiveCount: env.SQS_MY_WORKER_MAX_RECEIVE_COUNT,
    parsePayload: parseMyMessage,
  },
  {
    onProcess: async (job) => {
      // lógica de negócio
    },
    logger,
  },
);
```

---

## Workers com acesso ao banco

Workers rodam como Lambdas isoladas, sem container NestJS/DI. Quando um worker precisa ler ou gravar no banco (ex.: `survey-analysis`), inicialize um `DataSource` do TypeORM de forma lazy e reaproveite a conexão entre invocações (warm start):

```ts
// src/workers/my-worker/data-source.ts
import { DataSource } from 'typeorm';

import { SnakeNamingStrategy } from '@/config/snake-naming.strategy';
import { DATABASE_ENTITIES } from '@/domain/entities/database';

import { env } from './env';

let dataSource: DataSource | null = null;

export async function getDataSource(): Promise<DataSource> {
  if (!dataSource) {
    dataSource = new DataSource({
      type: 'postgres',
      host: env.DB_HOST,
      port: env.DB_PORT,
      username: env.DB_USERNAME,
      password: env.DB_PASSWORD,
      database: env.DB_DATABASE,
      entities: DATABASE_ENTITIES,
      namingStrategy: new SnakeNamingStrategy(),
      synchronize: false,
    });
  }

  if (!dataSource.isInitialized) {
    await dataSource.initialize();
  }

  return dataSource;
}
```

No `handler.ts`, obtenha o `DataSource` dentro de `onProcess` e repasse para a lógica de negócio. O worker `survey-analysis` (`src/workers/survey-analysis/`) é a referência completa desse padrão.

## Testando workers

Mock do `onProcess` e spy em `console.info`/`console.error` para verificar logs:

```ts
const mockOnProcess = jest.fn();

jest.mock('@/workers/my-worker/logger', () => ({
  logger: { info: jest.fn(), error: jest.fn() },
}));

// O builder chama console.info/console.error através do logger
// Spies ou mock do logger cobrem os asserts de log
```

O builder é testado implicitamente pelos testes de cada worker. A lógica de deduplicação (`checkIsProcessed`/`markProcessed`) tem testes próprios em `tests/unit/shared/queue/utils.spec.ts`.
