import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { UsersRepository } from '../../users/users.repository';

@Injectable()
export class JwtAuthGuard implements CanActivate {
  constructor(
    private readonly jwtService: JwtService,
    private readonly usersRepository: UsersRepository,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<{
      signedCookies?: { access_token?: string };
      user?: unknown;
    }>();
    const token = request.signedCookies?.access_token;

    if (!token) {
      throw new UnauthorizedException('Token de acesso ausente.');
    }

    try {
      const decoded: { user_id?: string } = this.jwtService.verify(token);

      if (!decoded?.user_id) {
        throw new UnauthorizedException('Token inválido.');
      }

      const user = await this.usersRepository.findById(decoded.user_id);

      if (!user) {
        throw new UnauthorizedException('Usuário não encontrado.');
      }

      request.user = user;
      return true;
    } catch (error) {
      console.error('Auth error:', error);
      throw new UnauthorizedException('Token inválido ou expirado.');
    }
  }
}
