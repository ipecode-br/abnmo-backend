# Documentação da API - ABNMO Backend

Bem-vindo à documentação técnica da API do sistema ABNMO (Associação Brasileira de Neuromielite Óptica). Este sistema foi desenvolvido para gerenciar pacientes, usuários e dados relacionados ao tratamento e acompanhamento de pacientes com Neuromielite Óptica.

## Documentações disponíveis

### Autenticação e usuários

- **[Autenticação](auth.md)** - Sistema de login, registro, recuperação e redefinição de senha
- **[Usuários](users.md)** - Gerenciamento de perfis e informações dos usuários

### Gestão de pacientes

- **[Pacientes](patients.md)** - Cadastro, consulta e gerenciamento de pacientes
- **[Contatos de apoio](patient-supports.md)** - Gerenciamento de contatos de apoio vinculados aos pacientes

### Relatórios e dados

- **[Estatísticas](statistics.md)** - Consultas e relatórios estatísticos do sistema

### Especificações técnicas

- **[Padrão de respostas](response.md)** - Formato padronizado das respostas da API
- **[Permissões de acesso](permissions.md)** - Matriz completa de permissões por perfil de usuário

## Arquitetura do sistema

Este sistema é construído utilizando:

- Framework: NestJS com TypeScript
- Banco de dados: MySQL com TypeORM
- Autenticação: JWT com cookies HTTP-only
- Validação: Zod schemas
- Documentação: Swagger

## Como usar esta documentação

Cada documento de rota contém:

1. Estrutura de dados: tabelas com campos, tipos e descrições
2. Rotas da API: endpoints com regras de negócio e fluxos
3. Logs e auditoria: registros de operações do sistema
4. Métodos do repository: funções disponíveis para acesso aos dados
5. Códigos de resposta: respostas HTTP padronizadas
6. Validações e restrições: regras de entrada e negócio

## Primeiros passos

1. Consulte a documentação de **[Autenticação](auth.md)** para entender como fazer login no sistema
2. Veja **[Padrão de respostas](response.md)** para entender o formato das respostas da API
3. Consulte **[Permissões de acesso](permissions.md)** para entender as regras de autorização
4. Explore as demais documentações conforme a funcionalidade desejada

## Links úteis

- [Código fonte no GitHub](https://github.com/ipecode-br/abnmo-backend)
- [Documentação da API (Swagger)](http://localhost:3000/swagger) (disponível quando o servidor local estiver rodando)

---

Esta documentação é mantida atualizada conforme a evolução do sistema. Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento.
