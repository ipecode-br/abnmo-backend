# Padrão de respostas

Este documento descreve o formato padrão de todas as respostas retornadas pela API, incluindo casos de sucesso e tratamento de erros.

## Estrutura de dados

### Schema base de resposta

Todas as respostas seguem o formato do _schema_ **baseResponseSchema** (`src/domain/schemas/base.ts`).

| Campo     | Tipo    | Obrigatório | Descrição                                  |
| --------- | ------- | ----------- | ------------------------------------------ |
| `success` | boolean | Sim         | Indica se a operação foi bem-sucedida      |
| `message` | string  | Sim         | Mensagem descritiva da operação            |
| `data`    | any     | Não         | Dados retornados (quando aplicável)        |
| `total`   | number  | Não         | Total de registros (para listas paginadas) |
| `fields`  | array   | Não         | Detalhes de erros de validação             |

### Formato para operações com dados

Para operações que retornam dados, é adicionada a propriedade `data`:

```js
{
  success: boolean,
  message: string,
  data: Data
}
```

### Formato para listas paginadas

Quando a resposta contém uma lista de itens, são incluídas as propriedades `data` e `total`:

```js
{
  success: boolean,
  message: string,
  data: Data,
  total: number,
}
```

### Formato para erros de validação

Quando ocorrem erros de validação, a resposta segue este formato:

```js
{
  success: false,
  message: 'Os dados enviados são inválidos.',
  fields: [
    {
      field: string, // Nome do campo com erro (caminho completo)
      error: string  // Mensagem de erro específica
    }
  ]
}
```

## 1. Respostas de sucesso

Operações bem-sucedidas retornam dados estruturados conforme o schema base.

### Regras de negócio

- **Estrutura**: sempre inclui `success: true` e `message` descritiva;
- **Dados**: propriedade `data` contém o resultado da operação quando aplicável;
- **Listas**: incluem `total` para facilitar implementação de paginação;
- **Consistência**: mesmo formato independente do endpoint.

### Especificações técnicas

- Schema: baseResponseSchema (`src/domain/schemas/base.ts`)
- Implementação: padronizada em todos os controllers

### Fluxo

1. Controller executa a operação solicitada;
2. Em caso de sucesso, monta resposta seguindo o schema base;
3. Retorna resposta estruturada com dados pertinentes.

## 2. Tratamento de erros de validação

Erros de validação de entrada são tratados de forma padronizada.

### Regras de negócio

- **Captura**: todos os erros de validação são interceptados automaticamente;
- **Formato**: estruturados em lista de campos com erros específicos;
- **Uso**: destinados ao desenvolvimento front-end, não para exibição direta ao usuário;
- **Prevenção**: validações devem ser implementadas no front-end antes das requisições.

### Especificações técnicas

- Pipe: GlobalZodValidationPipe (validação global)
- Filter: HttpExceptionFilter (tratamento global de erros)
- Schemas: definidos com Zod em cada DTO

### Fluxo

1. GlobalZodValidationPipe valida dados de entrada;
2. Em caso de erro, captura detalhes da validação;
3. HttpExceptionFilter formata resposta padronizada;
4. Retorna erro 422 com detalhes dos campos inválidos.

## Códigos de resposta HTTP

### Respostas de sucesso

- **200 OK**: Operação realizada com sucesso (GET, PUT, PATCH, DELETE)
- **201 Created**: Recurso criado com sucesso (POST)

### Respostas de erro

- **400 Bad Request**: Dados de entrada inválidos ou regra de negócio violada
- **401 Unauthorized**: Token de autenticação ausente ou inválido
- **403 Forbidden**: Usuário não possui permissões necessárias para a operação
- **404 Not Found**: Recurso não encontrado
- **409 Conflict**: Conflito de dados (duplicação, estado inválido, etc.)
- **422 Unprocessable Entity**: Dados de entrada não passaram na validação do schema
- **500 Internal Server Error**: Erro interno do servidor

## Validações e restrições

### Implementação técnica

- **GlobalZodValidationPipe**: Pipe global que valida todas as requisições com base nos _schemas_ Zod definidos;
- **HttpExceptionFilter**: Filtro global que padroniza todas as respostas de erro;
- **Schemas Zod**: Definidos em cada DTO para validação automática.

### Restrições de uso

- Erros de validação são destinados ao desenvolvimento front-end
- Validações devem ser implementadas no front-end antes das requisições
- Todas as respostas seguem o mesmo formato base para consistência
- Mensagens de erro devem ser tratadas adequadamente pelo consumidor da API

Esta padronização garante consistência em todas as respostas da API e facilita o consumo pela aplicação Front-End.
