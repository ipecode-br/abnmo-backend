# Tratamento de erros

## Visão geral

Todos os erros são tratados de forma centralizada pelo `HttpExceptionFilter`, registrado globalmente em `AppModule`. Ele captura exceções de qualquer camada (guards, pipes, controllers, use-cases) e retorna sempre uma resposta padronizada.

---

## `HttpExceptionFilter`

O filtro `@Catch()` intercepta exceções e aplica o tratamento adequado conforme o tipo:

1. **`ZodSerializationException`** — erro de validação do schema de resposta (500). A mensagem genérica `"Um erro inesperado ocorreu."` é retornada.
2. **`ZodValidationException`** — erro de validação do schema de request (400). Retorna `"Os dados enviados são inválidos."` com a lista de `fields`.
3. **`HttpException`** — exceção HTTP padrão. O status e mensagem da exceção são repassados.
4. **Erro desconhecido** — qualquer outra exceção retorna 500 com `"Um erro inesperado ocorreu."`. O erro completo é logado pelo `LogService`.

---

## Formato das respostas de erro

Erro padrão (404, 403, 409, etc.):

```json
{
  "success": false,
  "message": "Paciente não encontrado."
}
```

Erro de validação Zod:

```json
{
  "success": false,
  "message": "Os dados enviados são inválidos.",
  "fields": [
    {
      "field": "date",
      "error": "Invalid input: expected string, received Date"
    },
    { "field": "patientId", "error": "Invalid UUID" }
  ]
}
```

Erro interno inesperado:

```json
{
  "success": false,
  "message": "Um erro inesperado ocorreu."
}
```

---

## Exceções disponíveis

Use as classes nativas do NestJS, importadas de `@nestjs/common`:

| Exceção                       | HTTP | Quando usar                                          |
| ----------------------------- | :--: | ---------------------------------------------------- |
| `NotFoundException`           | 404  | Entidade não encontrada pelo ID                      |
| `UnauthorizedException`       | 401  | Credenciais inválidas, token expirado ou ausente     |
| `ForbiddenException`          | 403  | Permissão insuficiente ou violação de ownership      |
| `BadRequestException`         | 400  | Violação de regra de negócio                         |
| `ConflictException`           | 409  | Conflito de dados únicos (e-mail, CPF já cadastrado) |
| `ServiceUnavailableException` | 503  | Falha em serviço externo (e-mail, S3, assinatura)    |

---

## Propriedade `cause`

Sempre passe a propriedade `cause` com o erro original (em inglês) para que o `LogService` registre detalhes técnicos enquanto o usuário vê apenas a mensagem amigável:

```typescript
throw new NotFoundException('Paciente não encontrado.', {
  cause: `Patient with ID <${id}> not found`,
});

throw new ConflictException('Já existe uma conta cadastrada com este CPF.', {
  cause: `User with CPF <${cpf}> already exists`,
});
```

O `HttpExceptionFilter` extrai o `cause` e o loga automaticamente.

---

## Exemplos

```typescript
// Entidade não encontrada
const appointment = await this.appointmentsRepository.findOne({
  where: { id },
});
if (!appointment) {
  throw new NotFoundException('Atendimento não encontrado.', {
    cause: `Appointment with ID <${id}> not found`,
  });
}

// Conflito de dados únicos
const existing = await this.usersRepository.findOne({ where: { email } });
if (existing) {
  throw new ConflictException(
    'Já existe uma conta cadastrada com este e-mail.',
    {
      cause: `User with <${email}> already exists`,
    },
  );
}

// Regra de negócio violada
if (appointment.status !== 'scheduled') {
  throw new BadRequestException(
    'Apenas atendimentos agendados podem ser cancelados.',
    {
      cause: `Appointment <${id}> status is <${appointment.status}>`,
    },
  );
}

// Violação de ownership tratada pelo can()
can(
  user,
  ['update:appointment', 'update:appointment:others'],
  appointment.specialist?.id,
);
// → ForbiddenException implícito se falhar

// Falha em serviço externo
try {
  await this.mailService.send({ to: email, subject, html });
} catch (error) {
  throw new ServiceUnavailableException('Não foi possível enviar o e-mail.', {
    cause: error,
  });
}
```

---

## Regras

- Mensagens de exceção em **português (pt-BR)** — são exibidas ao usuário.
- Sempre incluir `cause` com o erro original em **inglês** — para diagnóstico nos logs.
- Usar `LogService` (nunca `console.log`) para logging adicional antes de lançar exceções.
- `can()` já lança `ForbiddenException` — não é necessário try/catch ao redor dele.
