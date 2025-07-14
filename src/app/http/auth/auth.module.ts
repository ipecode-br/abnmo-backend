import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { TypeOrmModule } from '@nestjs/typeorm';

import { CryptographyModule } from '@/app/cryptography/cryptography.module';
import { Token } from '@/domain/entities/token';
import { EnvModule } from '@/env/env.module';
import { EnvService } from '@/env/env.service';
import { UtilsModule } from '@/utils/utils.module';

import { UsersModule } from '../users/users.module';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './guards/jwt-auth.guard';
import { TokensRepository } from './tokens.repository';

@Module({
  imports: [
    TypeOrmModule.forFeature([Token]),
    EnvModule,
    CryptographyModule,
    UsersModule,
    UtilsModule,
    JwtModule.registerAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory: (envService: EnvService) => ({
        secret: envService.get('JWT_SECRET'),
        signOptions: { expiresIn: '8h' },
      }),
    }),
  ],
  providers: [AuthService, TokensRepository, JwtAuthGuard],
  controllers: [AuthController],
  exports: [AuthService, JwtAuthGuard, TokensRepository],
})
export class AuthModule {}
