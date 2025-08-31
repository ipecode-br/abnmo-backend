# Documentação da API - ABNMO Backend

Bem-vindo à documentação técnica da API do sistema ABNMO (Associação Brasileira de Neuromielite Óptica). Este sistema foi desenvolvido para gerenciar pacientes, usuários e dados relacionados ao tratamento e acompanhamento de pacientes com Neuromielite Óptica.

## 📚 Documentações Disponíveis

### Autenticação e Usuários

- **[Autenticação](auth.md)** - Sistema de login, registro, recuperação e redefinição de senha
- **[Usuários](users.md)** - Gerenciamento de perfis e informações dos usuários

### Gestão de Pacientes

- **[Pacientes](patients.md)** - Cadastro, consulta e gerenciamento de pacientes
- **[Contatos de Apoio](patient-supports.md)** - Gerenciamento de contatos de apoio vinculados aos pacientes

### Relatórios e Dados

- **[Estatísticas](statistics.md)** - Consultas e relatórios estatísticos do sistema

### Especificações Técnicas

- **[Padrão de Respostas](response.md)** - Formato padronizado das respostas da API

## 🏗️ Arquitetura do Sistema

Este sistema é construído utilizando:

- **Framework**: NestJS com TypeScript
- **Banco de dados**: MySQL com TypeORM
- **Autenticação**: JWT com cookies HTTP-only
- **Validação**: Zod schemas
- **Documentação**: Swagger/OpenAPI

## 🔐 Níveis de Acesso

O sistema possui 5 tipos de usuários com diferentes permissões:

| Role         | Descrição     | Permissões Principais                 |
| ------------ | ------------- | ------------------------------------- |
| `admin`      | Administrador | Acesso completo ao sistema            |
| `manager`    | Gerente       | Gestão de pacientes e estatísticas    |
| `nurse`      | Enfermeiro    | Cuidado e acompanhamento de pacientes |
| `specialist` | Especialista  | Consulta de dados de pacientes        |
| `patient`    | Paciente      | Acesso aos próprios dados             |

## 📖 Como usar esta documentação

Cada documento de rota contém:

1. **Estrutura de dados**: Tabelas com campos, tipos e descrições
2. **Rotas da API**: Endpoints com regras de negócio e fluxos
3. **Logs e auditoria**: Registros de operações do sistema
4. **Métodos do repository**: Funções disponíveis para acesso aos dados
5. **Códigos de resposta**: Respostas HTTP padronizadas
6. **Validações e restrições**: Regras de entrada e negócio

## 🚀 Primeiros Passos

1. Consulte a documentação de **[Autenticação](auth.md)** para entender como fazer login no sistema
2. Veja **[Padrão de Respostas](response.md)** para entender o formato das respostas da API
3. Explore as demais documentações conforme a funcionalidade desejada

## 🔗 Links Úteis

- [Código fonte no GitHub](https://github.com/ipecode-br/abnmo-backend)
- [Documentação da API (Swagger)](http://localhost:3000/api-docs) _(disponível quando o servidor estiver rodando)_

---

_Esta documentação é mantida atualizada conforme as evoluções do sistema. Para dúvidas ou sugestões, entre em contato com a equipe de desenvolvimento._
