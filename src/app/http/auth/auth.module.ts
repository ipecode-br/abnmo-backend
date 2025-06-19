import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';

@Module({
  imports: [
    EnvModule,
    CryptographyModule,
    UsersModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule {}
