import { getSignedUrl } from '@aws-sdk/cloudfront-signer';
import { BadRequestException, Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';

interface GenerateSignedUrlUseCaseInput {
  url: string;
  expiresInHours?: number;
}

interface GenerateSignedUrlUseCaseOutput {
  signedUrl: string;
  expiresAt: Date;
}

@Injectable()
@Log()
export class GenerateSignedUrlUseCase {
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
    url,
    expiresInHours = 1,
  }: GenerateSignedUrlUseCaseInput): GenerateSignedUrlUseCaseOutput {
    if (!url.startsWith(this.cdnPrivateUrl)) {
      throw new BadRequestException(
        'URLs assinadas são válidas apenas para arquivos privados.',
      );
    }

    if (expiresInHours <= 0) {
      throw new BadRequestException(
        'O tempo de expiração deve ser um número positivo.',
      );
    }

    const expiresAt = new Date(Date.now() + expiresInHours * 3600 * 1000);

    const signedUrl = getSignedUrl({
      url,
      dateLessThan: expiresAt,
      privateKey: this.cdnPrivateKey,
      keyPairId: this.cdnPublicKeyId,
    });

    this.logger.log('Signed URL generated', { url, expiresAt });

    return { signedUrl, expiresAt };
  }
}
