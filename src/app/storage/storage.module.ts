import { Module } from '@nestjs/common';

import { EnvModule } from '@/env/env.module';

import { DeleteFileUseCase } from './use-cases/delete-file.use-case';
import { GenerateSignedCookiesUseCase } from './use-cases/generate-signed-cookies.use-case';
import { GenerateSignedUrlUseCase } from './use-cases/generate-signed-url.use-case';
import { UploadFileUseCase } from './use-cases/upload-file.use-case';

@Module({
  imports: [EnvModule],
  providers: [
    DeleteFileUseCase,
    GenerateSignedCookiesUseCase,
    GenerateSignedUrlUseCase,
    UploadFileUseCase,
  ],
  exports: [
    DeleteFileUseCase,
    GenerateSignedCookiesUseCase,
    GenerateSignedUrlUseCase,
    UploadFileUseCase,
  ],
})
export class StorageModule {}
