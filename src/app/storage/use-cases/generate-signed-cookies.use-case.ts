import { getSignedCookies } from '@aws-sdk/cloudfront-signer';
import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { AuthUser } from '@/common/types';
import { EnvService } from '@/env/env.service';

interface GenerateSignedCookiesUseCaseInput {
  user: AuthUser;
  expiresAt: Date;
}

@Injectable()
@Log()
export class GenerateSignedCookiesUseCase {
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

  execute({
    user,
    expiresAt,
  }: GenerateSignedCookiesUseCaseInput): Array<[string, string]> {
    const { id, role } = user;
    const allowedPaths: string[] = [];

    if (role === 'admin' || role === 'manager') {
      allowedPaths.push('/*');
    }

    if (role === 'nurse') {
      allowedPaths.push('/patients/*');
    }

    if (role === 'patient') {
      allowedPaths.push(`/patients/${id}/*`);
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

    this.logger.log('CDN signed cookies generated', { user, allowedPaths });

    return Object.entries(signedCookies) as Array<[string, string]>;
  }
}
