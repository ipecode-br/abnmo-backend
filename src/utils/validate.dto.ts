// import { BadRequestException } from '@nestjs/common';
// import { validate } from 'class-validator';

// /** Validates DTO before service processing. */
// export async function validateDto(dto: object) {
//   const errors = await validate(dto);

//   console.log('Validation errors:', errors);

//   if (errors.length > 0) {
//     const messages = errors
//       .map((error) =>
//         error.constraints ? Object.values(error.constraints) : [],
//       )
//       .flat();

//     throw new BadRequestException(messages.join(', '));
//   }
// }
