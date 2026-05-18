# Documentação — ABNMO Backend

Documentação técnica da API do sistema ABNMO (Associação Brasileira de Neuromielite Óptica). A API gerencia pacientes, usuários, atendimentos, encaminhamentos e dados de saúde relacionados à Neuromielite Óptica.

## Arquitetura e padrões

- **[Arquitetura do sistema](architecture.md)** — visão geral, stack, estrutura de pastas e fluxo de uma requisição
- **[Camada de domínio](domain.md)** — entities, enums e schemas Zod: o que são e como criar
- **[Módulos](modules.md)** — estrutura de quatro arquivos, independência entre módulos, módulos compartilhados
- **[Controllers](controllers.md)** — convenções de rota, decorators, extração de parâmetros
- **[DTOs](dtos.md)** — criação com `createZodDto`, validação automática, convenções de nome
- **[Use-cases](use-cases.md)** — padrão de implementação, injeção de repositórios, transações, logging
- **[Padrão de respostas](responses.md)** — formato de sucesso, formato com dados e formato de erro
- **[Tratamento de erros](error-handling.md)** — `HttpExceptionFilter`, exceções disponíveis, regras de mensagem
- **[Logging](logging.md)** — `AppLogger`, decorator `@Logger()`, eventos tipados, padrão de uso
- **[Autenticação e autorização](authentication.md)** — JWT em cookies, guards, decorators `@Roles/@Public/@User/@Cookies`
- **[Permissões de acesso](permissions.md)** — matriz completa de permissões por perfil de usuário
