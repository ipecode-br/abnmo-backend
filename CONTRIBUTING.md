# Contribuindo

## Fluxo de trabalho

1. **Mantenha a branch `dev` atualizada**

   ```bash
   git checkout dev
   git pull dev
   ```

2. **Crie uma branch a partir da `dev`**

   ```bash
   git checkout -b feat/nome-da-task
   ```

   Prefixos recomendados: `feat/`, `fix/`, `chore/`, `docs/`.

3. **Implemente e teste localmente**

  O docker deve estar rodando localmente para executar os testes e2e.

   ```bash
   npm run dev  # sobe o servidor com hot-reload
   npm test     # suíte completa (unit + e2e)
   ```

4. **Crie ou atualize testes automatizados**

   - Testes unitários (`tests/**/*.spec.ts`) para use-cases e lógica de negócio.
   - Testes e2e (`tests/e2e/**/*.e2e-spec.ts`) para endpoints HTTP.
   - Nem toda mudança exige novos testes, mas alterações em regras de negócio, novas features, ou correções de bugs devem ser cobertas.

5. **Garanta que todos os testes passam antes de abrir um PR**

   ```bash
   npm run lint:prettier:fix && npm run validate    # formatação + lint + tipos
   npm test                                         # unit + e2e
   ```

   O pipeline de pré-commit (`husky` + `lint-staged`) também executa Prettier e ESLint automaticamente.

6. **Abra um Pull Request para `dev`**

   O PR deve incluir:

   - **Título** em inglês, imperativo e conciso.
   - **Resumo** (1-3 frases descrevendo a mudança em português).
   - **Objetivo** — por que a mudança é necessária (problema, ticket ou motivação).
   - **Principais mudanças** — lista do que foi feito, em bullets por implementação.
   - **Informações adicionais** — migrations a rodar, novas variáveis de ambiente, breaking changes, como testar manualmente, ou "Nenhuma".

## Convenções de código

- Commits seguem [Conventional Commits](https://www.conventionalcommits.org/).
- Arquivos em `kebab-case`.
- Mensagens de usuário em **português (pt-BR)**, logs em **inglês**.
- Nomes de export seguem o nome do arquivo (`create-appointment.use-case.ts` → `CreateAppointmentUseCase`).

Consulte [`AGENTS.md`](AGENTS.md) para o guia completo de padrões do projeto.
