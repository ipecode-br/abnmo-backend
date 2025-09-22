import { Injectable, Logger } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';

import { CreateInviteResponseSchema } from '@/domain/schemas/specialist';

import { SpecialistsRepository } from './specialists.repository';

@Injectable()
export class SpecialistsService {
  private readonly logger = new Logger(SpecialistsService.name);

  constructor(
    private readonly specialistsRepository: SpecialistsRepository,
    private readonly jwtService: JwtService,
  ) {}

  async createInvite(
    email: string,
    type: string,
  ): Promise<CreateInviteResponseSchema> {
    const payload = { email, type };

    const token = await this.jwtService.signAsync(payload, {
      expiresIn: undefined,
    });

    const url = `${process.env.APP_URL}/conta/completar-cadastro?type=${type}&token=${token}`;

    console.log('Invite URL:', url);

    return {
      success: true,
      message: 'Convite generado com sucesso.',
      data: { url, token },
    };
  }
}
