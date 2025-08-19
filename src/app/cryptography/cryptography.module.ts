import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

import { CryptographyService } from './crypography.service';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '12h' },
      }),
    }),
  ],
  providers: [CryptographyService],
  exports: [CryptographyService],
})
export class CryptographyModule {}
