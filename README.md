# 🧠 ABNMO Backend

Este repositório contém a API do projeto ABNMO, construída com [NestJS](https://nestjs.com/), [TypeORM](https://typeorm.io/) e banco de dados MySQL.

---

## 🚀 Tecnologias Utilizadas

- Node.js
- NestJS
- TypeORM
- MySQL
- Jest (testes)
- ESLint + Prettier (linting e formatação)
- Zod (validação)

---

## 📦 Instalação

Clone o repositório e instale as dependências:

```bash
git clone https://github.com/seu-usuario/abnmo-backend.git
cd abnmo-backend
npm install
```

---

## ⚙️ Ambiente de Desenvolvimento

Para rodar o projeto localmente:

1. Crie um arquivo `.env` na raiz do projeto com as credenciais de acesso ao banco de dados e outras variáveis necessárias.
2. Execute o comando:

```bash
npm run start:dev
```

Isso iniciará o servidor em modo de desenvolvimento com `watch`.

---

## 🧪 Testes

Execute os testes unitários com:

```bash
npm run test
```

Para ver a cobertura:

```bash
npm run test:cov
```

---

## 🧬 Migrations

Para gerar uma nova migration:

```bash
npm run db:generate NomeDaMigration
```

Para rodar as migrations:

```bash
npm run db:migrate
```

## 👨‍💻 Scripts úteis

- `npm run build`: Compila o projeto
- `npm run start`: Inicia o app em produção
- `npm run start:prod`: Inicia usando o `dist`
- `npm run lint:eslint:check`: Verifica problemas de lint
- `npm run lint:prettier:fix`: Corrige problemas de formatação

---

## 📡 Padrão de Respostas da API

### ✅ Sucesso

```json
{
  "success": true,
  "message": "Mensagem descritiva do sucesso",
  "data": {
    // dados retornados
  }
}
```

### ❌ Erro

```json
{
  "success": false,
  "message": "Mensagem descritiva do erro",
  "data": null
}
```

## Para mais detalhes consulte o Wiki do projeto em:

## https://github.com/ipecode-br/abnmo-backend/wiki
