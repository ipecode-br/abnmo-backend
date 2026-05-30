import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { AuthUser } from '@/common/types';
import { STORAGE_FOLDERS } from '@/config/storage';
import { EnvService } from '@/env/env.service';
import { setCookie } from '@/utils/cookies';

interface GenerateCdnCookiesUseCaseInput {
  user: AuthUser;
  expiresAt: Date;
  response: Response;
}

@Injectable()
@Log()
export class GenerateCdnCookiesUseCase {
  private readonly cdnPrivateUrl: string;
  private readonly cdnPublicKeyId: string;
  private readonly cdnPrivateKey: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.cdnPrivateUrl = this.envService.get('CDN_PRIVATE_URL');
    this.cdnPublicKeyId = this.envService.get('CDN_PUBLIC_KEY_ID');
    this.cdnPrivateKey = Buffer.from(
      this.envService.get('CDN_PRIVATE_KEY'),
      'base64',
    ).toString('utf-8');
  }

  execute({ user, response, expiresAt }: GenerateCdnCookiesUseCaseInput): void {
    const { id, role } = user;
    const allowedPaths: string[] = [];

    const sharedPaths = [
      `${STORAGE_FOLDERS.users.avatars}/*`,
      `${STORAGE_FOLDERS.patients.avatars}/*`,
    ];

    if (role === 'admin') {
      allowedPaths.push('/*');
    }

    if (role === 'manager' || role === 'nurse' || role === 'specialist') {
      for (const path of sharedPaths) {
        allowedPaths.push(path);
      }
    }

    if (role === 'patient') {
      allowedPaths.push(`${STORAGE_FOLDERS.patients.avatars}/*`);
      allowedPaths.push(`${STORAGE_FOLDERS.patients.documents(id)}/*`);
    }

    const policy = JSON.stringify({
      Statement: allowedPaths.map((path) => ({
        Resource: `${this.cdnPrivateUrl}${path}`,
        Condition: {
          DateLessThan: {
            'AWS:EpochTime': Math.floor(expiresAt.getTime() / 1000),
          },
        },
      })),
    });

    const signedCookies = getSignedCookies({
      keyPairId: this.cdnPublicKeyId,
      privateKey: this.cdnPrivateKey,
      policy,
    });

    const cookies = Object.entries(signedCookies) as Array<[string, string]>;

    for (const [name, value] of cookies) {
      setCookie(response, {
        name,
        value,
        sameSite: 'none',
        expires: expiresAt,
        signed: false,
      });
    }

    this.logger.log('CDN cookies generated', { user, allowedPaths });
  }
}
