# Workers

## Visão geral

Workers são funções AWS Lambda consumidoras de filas SQS, construídas com o builder `createQueueWorkerHandler`. O builder encapsula a lógica repetitiva — envelope parsing, deduplicação, classificação de erros, logging e reporte ao Sentry — deixando cada worker focado apenas na sua lógica de negócio.

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

### 5. Criar o DTO da mensagem em `src/shared/queue/`

```ts
// src/shared/queue/my-worker.dto.ts
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
  type: z.enum(['email', 'my-message']), // adicionar novo tipo
  payload: z.unknown(),
  idempotencyKey: z.uuid(),
});
```

### 7. Criar o handler (`handler.ts`)

```ts
import './sentry';
import { createQueueWorkerHandler } from '@/shared/queue/create-handler';
import { parseMyMessage } from '@/shared/queue/my-worker.dto';
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
