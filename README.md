# Sistema Viver Melhor (SVM) - ABNMO - Back-End

Aplicação Back-End do Sistema Viver Melhor (SVM), desenvolvida para a ABNMO. Este sistema foi projetado para equipes multidisciplinares de saúde, proporcionando uma plataforma centralizada para acompanhamento de pacientes, gerenciamento de encaminhamentos e consolidação de informações clínicas.

O sistema otimiza o fluxo de atendimento com integração de dados em uma interface responsiva, acessível e adaptável a diversos dispositivos.

---

## Tecnologias utilizadas

- Node.js
- NestJS
- TypeORM
- MySQL
- Jest (testes)
- ESLint + Prettier (linting e formatação)
- Zod (schemas e validação)
- Swagger (documentação)
- Docker (containers com banco de dados e app de desenvolvimento)

---

## Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/ipecode-br/abnmo-backend.git
cd abnmo-backend
npm install
```

---

## Ambiente de desenvolvimento

### Executando pela primeira vez

1. Copie o arquivo `.env.example` e renomeie para `.env` ou execute o comando:

```bash
cp .env.example .env
```

2. Com o Docker em execução, inicie a instância do banco de dados:

```bash
npm run services:up
```

3. Execute as migrações do banco de dados:

```bash
npm run db:migrate
```

4. Popule o banco de dados com dados de exemplo:

```bash
npm run db:seed-dev
```

5. Inicie a aplicação em modo de desenvolvimento:

```bash
npm run dev
```

### Executando a aplicação

Para iniciar a aplicação novamente, execute o comando abaixo com o Docker em funcionamento:

```bash
npm run dev
```

---

## Scripts úteis

- `npm run dev`: Inicia o container do banco de dados (Docker), aguarda a conexão estar disponível, executa as migrações (se houver pendências) e inicia o app em desenvolvimento
- `npm run start:dev`: Inicia apenas o app em desenvolvimento
- `npm run services:stop`: Interrompe a execução do container do banco de dados (Docker)
- `npm run services:down`: Exclui o container do banco de dados (Docker)
- `npm run lint:eslint:check`: Verifica problemas de lint
- `npm run lint:prettier:check`: Verifica problemas de formatação
- `npm run lint:prettier:fix`: Corrige problemas de formatação
