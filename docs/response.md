# Padrão de Respostas

Este documento descreve o formato padrão de todas as respostas retornadas pela API, incluindo casos de sucesso e tratamento de erros.

## Schema base de resposta

Todas as respostas seguem o formato do _schema_ **baseResponseSchema** (`src/domain/schemas/base.ts`).

### Quando há dados retornados

Para operações que retornam dados, é adicionada a propriedade `data`:

```js
{
  success: boolean,
  message: string,
  data: Data
}
```

### Quando há lista de dados

Quando a resposta contém uma lista de itens, são incluídas as propriedades `data` e `total`:

```js
{
  success: boolean,
  message: string,
  data: Data,
  total: number,
}
```

### Tratamento de erros de validação

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

Os erros contidos dentro da propriedade `fields` servem para orientar o desenvolvimento da aplicação Front-End e **não** devem ser utilizados para exibição ao usuário. Os dados devem ser validados pela aplicação Front-End antes de realizar a requisição, evitando requisições desnecessárias.

## Especificações técnicas

A validação é implementada utilizando:

- **GlobalZodValidationPipe**: Pipe global que valida todas as requisições com base nos _schemas_ Zod definidos;
- **HttpExceptionFilter**: Filtro global que padroniza todas as respostas de erro.

Os schemas são definidos usando a biblioteca `Zod` e todos os `DTOs` devem incluir um schema para validação automática.

Esta padronização garante consistência em todas as respostas da API e facilita o consumo pela aplicação Front-End.
