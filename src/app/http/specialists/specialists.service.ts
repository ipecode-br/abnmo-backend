import { Injectable, Logger } from '@nestjs/common';

import { CryptographyService } from '@/app/cryptography/crypography.service';
import { BaseResponseSchema } from '@/domain/schemas/base';
import {
  AUTH_TOKENS_MAPPER,
  InviteTokenPayloadType,
} from '@/domain/schemas/token';
import { EnvService } from '@/env/env.service';

import { TokensRepository } from '../auth/tokens.repository';
import { SpecialistsRepository } from './specialists.repository';

@Injectable()
export class SpecialistsService {
  private readonly logger = new Logger(SpecialistsService.name);

  constructor(
    private readonly specialistsRepository: SpecialistsRepository,
    private readonly cryptographyService: CryptographyService,
    private readonly tokensRepository: TokensRepository,
    private readonly envService: EnvService,
  ) {}

  async createInvite(email: string, role: string): Promise<BaseResponseSchema> {
    const token = await this.cryptographyService.createToken(
      AUTH_TOKENS_MAPPER.invite_token,
      { sub: email, role } as InviteTokenPayloadType,
      {},
    );

    await this.tokensRepository.saveToken({
      user_id: null,
      email,
      token,
      type: AUTH_TOKENS_MAPPER.invite_token,
      expires_at: null,
    });

    const appUrl = this.envService.get('APP_URL') ?? 'http://localhost:3000';
    const url = `${appUrl}/conta/completar-cadastro?type=${role}&token=${token}`;

    this.logger.log(`Invite URL: ${url}`);
    console.log('Invite URL:', url);

    return {
      success: true,
      message: 'Convite generado com sucesso.',
    };
  }
}
