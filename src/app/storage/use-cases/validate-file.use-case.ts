import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';

import { MAGIC_BYTES } from '@/config/storage';
import { EnvService } from '@/env/env.service';
import { formatSize } from '@/utils/formatters/format-size';
import { getFileExtension } from '@/utils/get-file-extension';

import { DeleteFileUseCase } from './delete-file.use-case';

interface ValidateFileUseCaseInput {
  allowedMimeTypes: readonly string[];
  maxSize: number;
  key: string;
}

interface ValidateFileUseCaseOutput {
  isValid: boolean;
  message: string;
  cause: string;
}

@Injectable()
export class ValidateFileUseCase {
  private readonly bucketName: string;

  constructor(
    private readonly deleteFileUseCase: DeleteFileUseCase,
    private readonly envService: EnvService,
    private readonly s3Client: S3Client,
  ) {
    this.bucketName = this.envService.get('STORAGE_BUCKET_NAME');
  }

  async execute({
    allowedMimeTypes,
    maxSize,
    key,
  }: ValidateFileUseCaseInput): Promise<ValidateFileUseCaseOutput> {
    const head = await this.s3Client
      .send(new HeadObjectCommand({ Bucket: this.bucketName, Key: key }))
      .catch(() => null);

    if (!head) {
      return {
        isValid: false,
        message: 'Documento não encontrado.',
        cause: `File with key <${key}> not found`,
      };
    }

    if (maxSize && head.ContentLength && head.ContentLength > maxSize) {
      await this.deleteFileUseCase.execute(key);
      return {
        isValid: false,
        message: `Arquivo não pode ser maior que ${formatSize(maxSize)}.`,
        cause: `File with key <${key}> exceeds maximum size of ${formatSize(maxSize)}`,
      };
    }

    const fileMimeType = head.ContentType || '';
    const allowedExtensions = allowedMimeTypes
      .map((mime) => getFileExtension(mime).toLocaleUpperCase())
      .join(', ');

    const invalidMimeTypeError = {
      isValid: false,
      message: `Formato de arquivo inválido. Por favor, use: ${allowedExtensions}.`,
      cause: `File with key <${key}> has invalid content type <${fileMimeType}>`,
    };

    if (!allowedMimeTypes.includes(fileMimeType)) {
      await this.deleteFileUseCase.execute(key);
      return invalidMimeTypeError;
    }

    const getResponse = await this.s3Client
      .send(
        new GetObjectCommand({
          Bucket: this.bucketName,
          Key: key,
          Range: 'bytes=0-4096',
        }),
      )
      .catch(() => null);

    if (!getResponse || !getResponse.Body) {
      await this.deleteFileUseCase.execute(key);
      return {
        isValid: false,
        message: 'Não foi possível ler o arquivo.',
        cause: `File with key <${key}> could not be read`,
      };
    }

    const chunk = Buffer.from(await getResponse.Body.transformToByteArray());

    const expectedSignatures = MAGIC_BYTES[fileMimeType];

    if (!expectedSignatures) {
      await this.deleteFileUseCase.execute(key);
      return invalidMimeTypeError;
    }

    const isValidSignature = expectedSignatures.some((signature) =>
      chunk.subarray(0, signature.length).equals(signature),
    );

    if (!isValidSignature) {
      await this.deleteFileUseCase.execute(key);
      return invalidMimeTypeError;
    }

    return {
      isValid: true,
      message: 'O arquivo enviado é válido.',
      cause: `File with key <${key}> is valid`,
    };
  }
}
