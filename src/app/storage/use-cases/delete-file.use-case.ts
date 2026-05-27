import { DeleteObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';

@Injectable()
@Log()
export class DeleteFileUseCase {
  private readonly bucketName: string;
  private readonly s3Client: S3Client;

  constructor(
    private readonly logger: LogService,
    private readonly envService: EnvService,
  ) {
    this.bucketName = this.envService.get('STORAGE_BUCKET_NAME');
    this.s3Client = new S3Client({});
  }

  async execute(s3Key: string): Promise<void> {
    try {
      const deleteCommand = new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: s3Key,
      });

      await this.s3Client.send(deleteCommand);

      this.logger.log('File deleted', { s3Key });
    } catch (error: unknown) {
      this.logger.error('File deletion failed', { s3Key, error });
      throw error;
    }
  }
}
