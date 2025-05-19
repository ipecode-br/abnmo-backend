import { Module } from '@nestjs/common';

import { BcryptHasher } from './bcrypt-hasher';

@Module({
  providers: [BcryptHasher],
  exports: [BcryptHasher],
})
export class CryptographyModule {}
