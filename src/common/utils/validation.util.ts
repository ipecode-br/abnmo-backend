import { BadRequestException } from '@nestjs/common';
import { validate } from 'class-validator';

/**
 * Valida um DTO antes de processá-lo no serviço. */

export async function validateDto(dto: object) {
  const errors = await validate(dto);

  console.log('Erros de validação:', errors);

  if (errors.length > 0) {
    // Filtra apenas os erros que têm constraints definidas
    const messages = errors
      .map((error) =>
        error.constraints ? Object.values(error.constraints) : [],
      )
      .flat(); // Garante que seja um array de strings

    throw new BadRequestException(messages.join(', '));
  }
}
