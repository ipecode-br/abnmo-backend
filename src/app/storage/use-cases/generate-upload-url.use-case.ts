import { S3Client } from '@aws-sdk/client-s3';
import { createPresignedPost } from '@aws-sdk/s3-presigned-post';
import { BadRequestException, Injectable } from '@nestjs/common';

import { Log } from '@/common/log/log.decorator';
import { LogService } from '@/common/log/log.service';
import { EnvService } from '@/env/env.service';
import { getFileExtension } from '@/utils/get-file-extension';

interface GenerateUploadUrlUseCaseInput {
  allowedMimeTypes: string[];
  expiresInSeconds: number;
  mimeType: string;
  fileSize: number;
  key: string;
}

interface GenerateUploadUrlUseCaseOutput {
  fields: Record<string, string>;
  url: string;
}

@Injectable()
@Log()
export class GenerateUploadUrlUseCase {
  private readonly bucketName: string;

  constructor(
    private readonly envService: EnvService,
    private readonly logger: LogService,
    private readonly s3Client: S3Client,
  ) {
    this.bucketName = this.envService.get('STORAGE_BUCKET_NAME');
  }

  async execute({
    allowedMimeTypes,
    expiresInSeconds,
    mimeType,
    fileSize,
    key,
  }: GenerateUploadUrlUseCaseInput): Promise<GenerateUploadUrlUseCaseOutput> {
    if (!allowedMimeTypes.includes(mimeType)) {
      const allowedExtensions = allowedMimeTypes
        .map((mimeType) => getFileExtension(mimeType).toUpperCase())
        .join(', ');

      throw new BadRequestException(
        `Formato de arquivo não permitido. Formatos aceitos: ${allowedExtensions}.`,
        { cause: `Invalid content type <${mimeType}>` },
      );
    }

    const { url, fields } = await createPresignedPost(this.s3Client, {
      Key: key,
      Expires: expiresInSeconds,
      Bucket: this.bucketName,
      Fields: { 'Content-Type': mimeType },
      Conditions: [
        ['content-length-range', 1, fileSize],
        ['eq', '$Content-Type', mimeType],
      ],
    });

    this.logger.log('Document upload URL generated', { key });

    return { url, fields };
  }
}
