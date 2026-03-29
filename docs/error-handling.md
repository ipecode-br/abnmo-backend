# Tratamento de erros

## Visão geral

Todos os erros são tratados de forma centralizada pelo `HttpExceptionFilter`, registrado globalmente em `AppModule`. Ele captura qualquer exceção lançada em qualquer camada (guards, pipes, controllers, use-cases) e retorna sempre uma resposta padronizada.

---

## `HttpExceptionFilter`

O filtro `@Catch()` intercepta toda exceção e:

1. Extrai o status HTTP e a mensagem da exceção.
2. Para erros de validação Zod (`BadRequestException` com `fields`), repassa a lista de campos inválidos.
3. Para qualquer exceção com status `500 Internal Server Error`, a mensagem é sempre substituída por `'Um erro inesperado ocorreu.'` — nunca detalhes internos são expostos ao cliente.
4. Loga a exceção via `AppLogger`.

Formato da resposta de erro:

```json
{
  "success": false,
  "message": "Paciente não encontrado."
}
```

Com erros de validação:

```json
{
  "success": false,
  "message": "Os dados enviados são inválidos.",
  "fields": [
    { "field": "date", "error": "Invalid date" },
    { "field": "patientId", "error": "Required" }
  ]
}
```

---

## Exceções disponíveis

Use as classes de exceção nativas do NestJS. Importe de `@nestjs/common`:

| Exceção | Status HTTP | Quando usar |
|---|---|---|
| `NotFoundException` | 404 | Entidade não encontrada pelo ID fornecido |
| `UnauthorizedException` | 401 | Credenciais inválidas, token expirado ou ausente |
| `ForbiddenException` | 403 | Permissão insuficiente ou violação de ownership |
| `BadRequestException` | 400 | Dados inválidos do ponto de vista de regra de negócio |
| `ConflictException` | 409 | Conflito de dados únicos (e-mail, CPF já cadastrado) |
| `ServiceUnavailableException` | 503 | Falha em serviço externo (ex: envio de e-mail) |

---

## Exemplos

```typescript
// Entidade não encontrada
const appointment = await this.appointmentsRepository.findOne({ where: { id } });
if (!appointment) {
  throw new NotFoundException('Atendimento não encontrado.');
}

// Conflito de dados únicos
const existing = await this.patientsRepository.findOne({ where: { cpf } });
if (existing) {
  throw new ConflictException('Já existe um paciente cadastrado com este CPF.');
}

// Regra de negócio violada
if (appointment.status === 'canceled') {
  throw new BadRequestException('Este atendimento já foi cancelado.');
}

// Violação de ownership
if (user.id !== targetUserId && user.role !== 'admin') {
  throw new ForbiddenException('Você não tem permissão para atualizar este usuário.');
}

// Falha em serviço externo
const sent = await this.mailService.send({ to: email, ... });
if (!sent) {
  throw new ServiceUnavailableException('Não foi possível enviar o e-mail de convite.');
}
```

---

## Regra: português para o usuário, inglês para os logs

Mensagens de exceção são exibidas diretamente na interface — devem estar em **português (pt-BR)**:

```typescript
throw new NotFoundException('Paciente não encontrado.');
throw new BadRequestException('A data deve estar dentro dos próximos 3 meses.');
```

Mensagens de log são para desenvolvedores — devem estar em **inglês**:

```typescript
this.logger.warn('Cancel appointment failed: already canceled', { id });
this.logger.error('Create patient failed: email already registered', { email });
```

---

## Erros internos inesperados

Qualquer exceção que não seja uma `HttpException` (ex: erro de banco, `ReferenceError`) é capturada pelo filtro e retornada como:

```json
{
  "success": false,
  "message": "Um erro inesperado ocorreu."
}
```

O erro completo é logado internamente pelo `AppLogger` para investigação, mas nunca é exposto ao cliente.
