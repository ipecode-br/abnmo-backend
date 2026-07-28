# ABNMO — Backend

API do Sistema Viver Melhor (SVM) para a ABNMO. Plataforma centralizada para acompanhamento de pacientes, gerenciamento de encaminhamentos e consolidação de dados clínicos por equipes multidisciplinares de saúde.

## Stack

Node.js · NestJS · TypeORM · PostgreSQL · Zod · Sentry · Docker

## Instalação

```bash
git clone https://github.com/ipecode-br/abnmo-backend.git
cd abnmo-backend
npm install
cp .env.example .env
```

## Desenvolvimento

```bash
npm run dev
```

Sobe o banco via Docker, executa as migrations pendentes e inicia o servidor com hot-reload em `http://localhost:3333`.

### Seed (dados de exemplo)

```bash
npm run db:seed-dev
```

### Validação (formatação + lint + tipos)

```bash
npm run lint:prettier:fix && npm run validate
```

## Testes

```bash
npm run test              # suíte completa (unit + e2e)
npm run test:unit          # apenas unitários (paralelo, sem banco)
npm run test:prepare && npm run test:e2e  # apenas e2e
```

Para rodar um único arquivo e2e:

```bash
npm run test:prepare && npx jest --config tests/config/jest-e2e.json tests/e2e/appointments.e2e-spec.ts
```

Testes unitários usam repositórios mockados. Testes e2e executam contra o mesmo banco de desenvolvimento, em um schema `test` isolado via `search_path` do PostgreSQL.

## Monitoramento

O Sentry captura erros 5xx e encaminha logs de erro quando configurado via variáveis de ambiente:

```bash
SENTRY_DSN="https://<key>@o<orgId>.ingest.sentry.io/<projectId>"
SENTRY_LOGS="error"  # "none" | "error" | "all"
```

Sem `SENTRY_DSN`, o Sentry permanece inativo — seguro para desenvolvimento local e repositório público.

## Contribuindo

Veja [`CONTRIBUTING.md`](CONTRIBUTING.md) para diretrizes de contribuição, fluxo de branches e criação de PRs.

## Documentação

Consulte [`docs/index.md`](docs/index.md) para detalhes de arquitetura, autenticação, permissões, DTOs, controllers e uso de schemas Zod.
