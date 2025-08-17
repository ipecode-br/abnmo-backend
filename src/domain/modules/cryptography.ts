import type { JwtSignOptions } from '@nestjs/jwt';

import type { AuthTokenPayloadByType } from '../schemas/token';

export abstract class Cryptography {
  abstract createHash(plain: string): Promise<string>;

  abstract compareHash(plain: string, hash: string): Promise<boolean>;

  abstract createToken<T extends keyof AuthTokenPayloadByType>(
    _type: T,
    payload: AuthTokenPayloadByType[T],
    options?: JwtSignOptions,
  ): Promise<string>;

  abstract verifyToken<Payload extends object>(token: string): Promise<Payload>;
}
