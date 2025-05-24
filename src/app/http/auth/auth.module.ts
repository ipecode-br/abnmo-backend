import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';

import { UsersModule } from '../users/users.module';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';
import { BcryptHasher } from '@/app/cryptography/bcrypt-hasher';

@Module({
  imports: [
    UsersModule,
    BcryptHasher,
    EnvModule,
    JwtModule.registerAsync({
      imports: [EnvModule, BcryptHasher],
      inject: [EnvService],
      useFactory: async (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '1d' },
      }),
    }),
  ],
  providers: [AuthService,BcryptHasher],
  controllers: [AuthController],
  exports: [AuthService],
})
export class AuthModule { }
