import { S3Client } from '@aws-sdk/client-s3';
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';

import { Document } from '@/domain/entities/document';
import { EnvModule } from '@/env/env.module';

import { DeleteFileUseCase } from './use-cases/delete-file.use-case';
import { GenerateCdnCookiesUseCase } from './use-cases/generate-cdn-cookies.use-case';
import { GenerateSignedUrlUseCase } from './use-cases/generate-signed-url.use-case';
import { GenerateUploadUrlUseCase } from './use-cases/generate-upload-url.use-case';
import { UploadFileUseCase } from './use-cases/upload-file.use-case';
import { ValidateFileUseCase } from './use-cases/validate-file.use-case';

@Module({
  imports: [EnvModule, TypeOrmModule.forFeature([Document])],
  providers: [
    { provide: S3Client, useValue: new S3Client({}) },
    DeleteFileUseCase,
    GenerateCdnCookiesUseCase,
    GenerateSignedUrlUseCase,
    GenerateUploadUrlUseCase,
    UploadFileUseCase,
    ValidateFileUseCase,
  ],
  exports: [
    S3Client,
    DeleteFileUseCase,
    GenerateCdnCookiesUseCase,
    GenerateSignedUrlUseCase,
    GenerateUploadUrlUseCase,
    UploadFileUseCase,
    ValidateFileUseCase,
  ],
})
export class StorageModule {}
