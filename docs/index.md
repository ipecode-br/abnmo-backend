# Documentação — ABNMO Backend

Documentação técnica da API do sistema ABNMO (Associação Brasileira de Neuromielite Óptica). A API gerencia pacientes, usuários, atendimentos, encaminhamentos e dados de saúde.

## Arquitetura e padrões

- **[Arquitetura do sistema](architecture.md)** — visão geral, stack, estrutura de pastas e fluxo de uma requisição
- **[Camada de domínio](domain.md)** — entities, enums e schemas Zod: como criar
- **[Módulos](modules.md)** — estrutura de quatro arquivos, independência entre módulos, módulos compartilhados
- **[Controllers](controllers.md)** — convenções de rota, decorators, extração de parâmetros
- **[DTOs](dtos.md)** — criação com `createZodDto`, validação automática, convenções de nomenclatura
- **[Use-cases](use-cases.md)** — padrão de implementação, injeção de repositórios, transações, logging
- **[Padrão de respostas](responses.md)** — formato de sucesso, formato com dados e formato de erro
- **[Tratamento de erros](error-handling.md)** — `HttpExceptionFilter`, exceções disponíveis, regras de mensagem
- **[Logging](logging.md)** — `LogService`, decorator `@Log()`, eventos tipados, padrão de uso
- **[Autenticação e autorização](authentication.md)** — JWT em cookies, guards, decorators, `can()`
- **[Permissões de acesso](permissions.md)** — features por recurso, conjuntos padrão por perfil, matriz de acesso
