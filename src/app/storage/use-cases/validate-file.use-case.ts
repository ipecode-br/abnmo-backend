import {
  GetObjectCommand,
  HeadObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';

import { MAGIC_BYTES } from '@/config/storage';
import { Document } from '@/domain/entities/document';
import type { DocumentMimeType } from '@/domain/enums/documents';
import { EnvService } from '@/env/env.service';
import { formatSize } from '@/utils/formatters/format-size';
import { getFileExtension } from '@/utils/get-file-extension';

import { DeleteFileUseCase } from './delete-file.use-case';

interface ValidateFileUseCaseInput {
  allowedMimeTypes: readonly string[];
  documentId?: string;
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
    @InjectRepository(Document)
    private readonly documentsRepository: Repository<Document>,
    private readonly envService: EnvService,
    private readonly s3Client: S3Client,
  ) {
    this.bucketName = this.envService.get('STORAGE_BUCKET_NAME');
  }

  async execute({
    allowedMimeTypes,
    documentId,
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

    if (documentId) {
      await this.documentsRepository.update(documentId, {
        status: 'confirmed',
        size: head.ContentLength ?? 0,
        mimeType: fileMimeType as DocumentMimeType,
      });
    }

    return {
      isValid: true,
      message: 'O arquivo enviado é válido.',
      cause: `File with key <${key}> is valid`,
    };
  }
}
