import { z } from 'zod';

export const baseResponseSchema = z.object({
  success: z.boolean().describe('Confirma se a operação foi bem-sucedida.'),
  message: z.string().describe('Mensagem de resposta pertinente à requisição.'),
});
