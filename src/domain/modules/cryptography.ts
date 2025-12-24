import type { JwtSignOptions } from '@nestjs/jwt';

import type { AuthTokenPayloads } from '../schemas/tokens';

export abstract class Cryptography {
  abstract createHash(plain: string): Promise<string>;

  abstract compareHash(plain: string, hash: string): Promise<boolean>;

  abstract createToken<T extends keyof AuthTokenPayloads>(
    _type: T,
    payload: AuthTokenPayloads[T],
    options?: JwtSignOptions,
  ): Promise<string>;

  abstract verifyToken<Payload extends object>(token: string): Promise<Payload>;
}
