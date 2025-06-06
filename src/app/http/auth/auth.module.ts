import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { BcryptHasher } from '@/app/cryptography/bcrypt-hasher';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';

@Module({
  imports: [
    UsersModule,
    EnvModule,
    JwtModule.registerAsync({
      imports: [EnvModule, BcryptHasher],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService, BcryptHasher, AuthGuard],
  controllers: [AuthController],
  exports: [AuthService, AuthGuard, JwtModule, BcryptHasher],
})
export class AuthModule {}
