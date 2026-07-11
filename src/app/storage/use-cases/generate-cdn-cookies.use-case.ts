import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { Injectable } from '@nestjs/common';
import { Response } from 'express';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { ContextUser } from '@/common/types';
import { STORAGE_FOLDERS } from '@/config/storage';
import { EnvService } from '@/env/env.service';
import { setCookie } from '@/utils/cookies';

interface GenerateCdnCookiesUseCaseInput {
  expiresAt: Date;
  user: ContextUser;
  response: Response;
}

@Injectable()
@Log()
export class GenerateCdnCookiesUseCase {
  private readonly isTestMode: boolean;
  private readonly cdnUrl: string;
  private readonly cdnPublicKeyId: string;
  private readonly cdnPrivateKey: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
  ) {
    this.isTestMode = this.envService.get('NODE_ENV') === 'test';
    this.cdnUrl = this.envService.get('CDN_URL');
    this.cdnPublicKeyId = this.envService.get('CDN_PUBLIC_KEY_ID');
    this.cdnPrivateKey = Buffer.from(
      this.envService.get('CDN_PRIVATE_KEY'),
      'base64',
    ).toString('utf-8');
  }

  execute({ user, expiresAt, response }: GenerateCdnCookiesUseCaseInput): void {
    if (this.isTestMode) {
      this.logger.log('Test mode: skipping CDN cookie generation');
      return;
    }

    const allowedPaths: string[] = [];
    const { role } = user;

    if (role === 'admin') {
      allowedPaths.push('/*');
    }

    const sharedPaths = [
      `${STORAGE_FOLDERS.users.avatars(user.id)}/*`,
      `${STORAGE_FOLDERS.patients.avatarsRoot}/*`,
    ];

    if (role === 'member' || role === 'specialist') {
      for (const path of sharedPaths) {
        allowedPaths.push(path);
      }
    }

    if (role === 'patient') {
      allowedPaths.push(`${STORAGE_FOLDERS.patients.avatars(user.id)}/*`);
      allowedPaths.push(`${STORAGE_FOLDERS.patients.documents(user.id)}/*`);
    }

    const policy = JSON.stringify({
      Statement: allowedPaths.map((path) => ({
        Resource: `${this.cdnUrl}/${path}`,
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
      setCookie(response, this.envService, {
        expires: expiresAt,
        name,
        signed: false,
        value,
      });
    }

    this.logger.log('CDN cookies generated', { user, allowedPaths });
  }
}
