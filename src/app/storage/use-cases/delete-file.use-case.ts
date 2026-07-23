import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';

@Injectable()
@Log()
export class DeleteFileUseCase {
  private readonly bucketName: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly s3Client: S3Client,
  ) {
    this.bucketName = this.envService.get('STORAGE_BUCKET_NAME');
  }

  async execute(key: string): Promise<void> {
    const deleteCommand = new DeleteObjectCommand({
      Bucket: this.bucketName,
      Key: key,
    });

    await this.s3Client.send(deleteCommand);

    this.logger.log('File deleted', { key });
  }
}
