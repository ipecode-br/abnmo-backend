import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { EnvService } from '@/env/env.service';

import { CryptographyService } from './cryptography.service';
import { CreateTokenUseCase } from './use-cases/create-token.use-case';

@Module({
  imports: [
    JwtModule.registerAsync({
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [CryptographyService, CreateTokenUseCase],
  exports: [CryptographyService, CreateTokenUseCase],
})
export class CryptographyModule {}
