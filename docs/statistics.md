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

### Filtros de período

| Campo    | Tipo   | Obrigatório | Descrição                             |
| -------- | ------ | ----------- | ------------------------------------- |
| `period` | string | Não         | Período para análise das estatísticas |

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

### Fluxo

1. Valida parâmetros de período fornecidos;
2. Executa consulta agregada filtrando por período;
3. Agrupa resultados por gênero;
4. Retorna estatísticas organizadas por gênero.

## Logs e auditoria

O sistema registra logs para as seguintes operações:

### Logs de sucesso

- **Consulta de estatísticas totais**: registra ID do usuário e timestamp
- **Consulta de estatísticas por gênero**: registra ID do usuário, período consultado e timestamp

## Métodos do repository

### Métodos públicos disponíveis

- `getPatientsTotal()`: Retorna estatísticas totais de pacientes
- `getPatientsStatisticsByPeriod(period)`: Retorna estatísticas por período e gênero
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

- **Período**: Deve ser um formato válido conforme schema definido
- **Parâmetros**: Todos os parâmetros de query são validados automaticamente

### Restrições de negócio

- Apenas usuários com permissões administrativas (`manager`, `nurse`) podem acessar estatísticas
- Os dados são agregados e não expõem informações individuais dos pacientes
- Estatísticas consideram apenas pacientes ativos no sistema
- Consultas são otimizadas para performance com agregações no banco de dados
- Os resultados são calculados em tempo real sem cache implementado
