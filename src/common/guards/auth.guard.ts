import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { InjectRepository } from '@nestjs/typeorm';
import type { Repository } from 'typeorm';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import type { AuthUserDto } from '@/app/http/auth/auth.dtos';
import type { Cookie } from '@/domain/cookies';
import { Patient } from '@/domain/entities/patient';
import { User } from '@/domain/entities/user';
import type { AccessTokenPayload } from '@/domain/schemas/token';

import { IS_PUBLIC_KEY } from '../decorators/public.decorator';

@Injectable()
export class AuthGuard implements CanActivate {
  constructor(
    private readonly reflector: Reflector,
    private readonly cryptographyService: CryptographyService,
    @InjectRepository(User)
    private readonly usersRepository: Repository<User>,
    @InjectRepository(Patient)
    private readonly patientsRepository: Repository<Patient>,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (isPublic) {
      return true;
    }

    const request = context.switchToHttp().getRequest<{
      signedCookies?: Record<Cookie, string>;
      user?: AuthUserDto;
    }>();

    const token = request.signedCookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    try {
      const tokenPayload =
        await this.cryptographyService.verifyToken<AccessTokenPayload>(token);

      const userId = tokenPayload.sub;
      const role = tokenPayload.role;

      if (!userId) {
        throw new UnauthorizedException('Token inválido.');
      }

      if (role === 'patient') {
        const user = await this.patientsRepository.findOne({
          select: { id: true, email: true },
          where: { id: userId },
        });

        if (!user) {
          throw new UnauthorizedException('Usuário não encontrado.');
        }

        request.user = { id: user.id, email: user.email, role };

        return true;
      }

      const user = await this.usersRepository.findOne({
        select: { id: true, email: true, role: true },
        where: { id: userId },
      });

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      request.user = { id: user.id, email: user.email, role };

      return true;
    } catch {
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
