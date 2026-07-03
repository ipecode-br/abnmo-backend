import { PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { BadRequestException, Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import { formatSize } from '@/utils/formatters/format-size';

interface UploadFileUseCaseInput {
  visibility: 'public' | 'private';
  fileName: string;
  mimeType: string;
  buffer: Buffer;
  folder?: string;
}

interface UploadFileUseCaseOutput {
  url: string;
  s3Key: string;
  fileName: string;
  size: string;
}

@Injectable()
@Log()
export class UploadFileUseCase {
  private readonly bucketName: string;
  private readonly cdnUrl: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly s3Client: S3Client,
  ) {
    this.bucketName = this.envService.get('STORAGE_BUCKET_NAME');
    this.cdnUrl = this.envService.get('CDN_URL');
  }

  async execute({
    visibility,
    fileName,
    mimeType,
    buffer,
    folder,
  }: UploadFileUseCaseInput): Promise<UploadFileUseCaseOutput> {
    if (folder) {
      this.validateFolder(folder);
    }

    const filePath = folder ? `${folder}/${fileName}` : `/${fileName}`;
    const s3Key = `${visibility}${filePath}`;

    const uploadCommand = new PutObjectCommand({
      Bucket: this.bucketName,
      Key: s3Key,
      Body: buffer,
      ContentType: mimeType,
    });

    await this.s3Client.send(uploadCommand);

    const cdnBaseUrl = `${this.cdnUrl}/${visibility}`;
    const url = `${cdnBaseUrl}${filePath}`;
    const size = formatSize(buffer.length);

    this.logger.log('File uploaded', { url, s3Key, size });

    return { url, s3Key, fileName, size };
  }

  private validateFolder(folder: string) {
    if (
      !folder.startsWith('/') ||
      folder.startsWith('.') ||
      folder.endsWith('/') ||
      folder.includes('.') ||
      folder.includes('//')
    ) {
      throw new BadRequestException('Caminho de pasta inválido.');
    }
  }
}
