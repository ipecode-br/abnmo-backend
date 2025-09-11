# Estatísticas

Este documento descreve as rotas, regras de negócio e especificações técnicas referentes às estatísticas do sistema.

## Estrutura de dados

### Estatísticas totais de pacientes

| Campo      | Tipo   | Descrição                   |
| ---------- | ------ | --------------------------- |
| `total`    | number | Total geral de pacientes    |
| `active`   | number | Total de pacientes ativos   |
| `inactive` | number | Total de pacientes inativos |

### Estatísticas por gênero

| Campo    | Tipo   | Descrição                                                                                          |
| -------- | ------ | -------------------------------------------------------------------------------------------------- |
| `gender` | enum   | Gênero (`male_cis`, `female_cis`, `male_trans`, `female_trans`, `non_binary`, `prefer_not_to_say`) |
| `total`  | number | Total de pacientes deste gênero                                                                    |

### Estatísticas por cidade

| Campo   | Tipo   | Descrição                       |
| ------- | ------ | ------------------------------- |
| `city`  | string | Nome da cidade                  |
| `total` | number | Total de pacientes nesta cidade |

### Filtros de período

| Campo        | Tipo   | Obrigatório | Descrição                                                             |
| ------------ | ------ | ----------- | --------------------------------------------------------------------- |
| `last-week`  | string | Não         | Pacientes criados a partir de 7 dias atrás até o final da data atual  |
| `last-month` | string | Não         | Pacientes criados a partir de 30 dias atrás até o final do dia atual  |
| `last-year`  | string | Não         | Pacientes criados a partir de 365 dias atrás até o final do dia atual |

### Query Params adicionais

| Campo    | Tipo   | Obrigatório | Descrição                                                                    |
| -------- | ------ | ----------- | ---------------------------------------------------------------------------- |
| `search` | string | Não         | Texto opcional para buscar pacientes pelo nome ou outros campos relevantes   |
| `order`  | enum   | Não         | Ordenação dos resultados: ASC (crescente) ou DESC (decrescente). Padrão: ASC |
| `page`   | number | Não         | Número da página de resultados. Padrão: 1                                    |
| `limit`  | number | Não         | Quantidade máxima de resultados por página. Padrão: 10                       |

## 1. Estatísticas totais de pacientes

Retorna um resumo geral dos totais de pacientes no sistema.

**Rota**: `GET /statistics/patients/total`

### Regras de negócio

- **Permissões**: usuários `manager` e `nurse`;
- Apresenta totais gerais: total de pacientes, ativos e inativos.

### Especificações técnicas

- Não requer parâmetros

### Fluxo

1. Executa consulta agregada no banco de dados;
2. Calcula totais de pacientes por status;
3. Retorna estatísticas consolidadas.

## 2. Estatísticas de pacientes por gênero

Retorna estatísticas de pacientes agrupadas por gênero em um período específico.

**Rota**: `GET /statistics/patients-by-gender`

### Regras de negócio

- **Permissões**: usuários `manager` e `nurse`;
- Permite filtrar por período específico;
- Agrupa dados por gênero dos pacientes.

### Especificações técnicas

- Request Query: GetPatientsByPeriodDto (`src/app/http/statistics/statistics.dtos.ts`)
- Filtros disponíveis:
  - `period`: período para análise das estatísticas
  - `search`, `order`, `page`, `limit` (herdados do `baseQuerySchema`)

### Fluxo

1. Valida parâmetros de período fornecidos;
2. Executa consulta agregada filtrando por período;
3. Agrupa resultados por gênero;
4. Retorna estatísticas organizadas por gênero.

## 3. Estatísticas de pacientes por cidade

Retorna estatísticas de pacientes agrupadas por cidade em um período específico.

**Rota**: `GET /statistics/patients-by-city`

### Regras de negócio

- **Permissões**: usuários `manager` e `nurse`;
- Permite filtrar por período específico;
- Agrupa dados por cidade dos pacientes.

### Especificações técnicas

- Request Query: GetPatientsByPeriodDto (`src/app/http/statistics/statistics.dtos.ts`)
- Filtros disponíveis:
  - `period`: período para análise das estatísticas
  - `search`, `order`, `page`, `limit` (herdados do `baseQuerySchema`)

### Fluxo

1. Valida parâmetros de período fornecidos;
2. Executa consulta agregada filtrando por período;
3. Agrupa resultados por cidade;
4. Retorna estatísticas organizadas por cidade.

## Logs e auditoria

O sistema registra logs para as seguintes operações:

### Logs de sucesso

- **Consulta de estatísticas totais**: registra ID do usuário e timestamp
- **Consulta de estatísticas por gênero**: registra ID do usuário, período consultado e timestamp
- **Consulta de estatísticas por cidade**: registra ID do usuário, período consultado e timestamp

## Métodos do repository

### Métodos públicos disponíveis

- `getPatientsTotal()`: Retorna estatísticas totais de pacientes
- `getPatientsStatisticsByPeriod(period, filter)`: Retorna estatísticas por período e tipo de filtro (`gender` ou `city`)
- `getActivePatients()`: Conta pacientes ativos
- `getInactivePatients()`: Conta pacientes inativos

## Códigos de resposta HTTP

### Respostas de sucesso

- **200 OK**: Estatísticas retornadas com sucesso

### Respostas de erro

- **400 Bad Request**: Parâmetros de filtro inválidos
- **401 Unauthorized**: Token de autenticação ausente ou inválido
- **403 Forbidden**: Usuário não possui permissões necessárias
- **422 Unprocessable Entity**: Dados de entrada não passaram na validação do schema
- **500 Internal Server Error**: Erro interno do servidor

## Validações e restrições

### Validações de entrada

- **Período**: Período: Deve ser um formato válido conforme schema definido (`last-week`, `last-month`, `last-year`)
- **Parâmetros**: Todos os parâmetros de query são validados automaticamente
- **Filtros**: Deve ser `gender` ou `city`

### Restrições de negócio

- Apenas usuários com permissões administrativas (`manager`, `nurse`) podem acessar estatísticas
- Os dados são agregados e não expõem informações individuais dos pacientes
- Estatísticas consideram apenas pacientes ativos no sistema
- Consultas são otimizadas para performance com agregações no banco de dados
- Os resultados são calculados em tempo real sem cache implementado
