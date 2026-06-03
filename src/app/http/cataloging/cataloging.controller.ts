import {
  Body,
  Controller,
  Post,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiOperation, ApiResponse, ApiTags } from '@nestjs/swagger';
import { Express } from 'express';

import { Public } from '@/common/decorators/public.decorator';
import { BaseResponse } from '@/common/dtos';
import { FileValidationPipe } from '@/common/file-validation.pipe';
import { Log } from '@/common/log/log.decorator';
import { MIME_TYPES } from '@/constants/mime-types';

import { CreateCatalogingDto } from './cataloging.dtos';

@Public()
@ApiTags('Catalogação')
@Controller('cataloging')
export class CatalogingController {
  constructor() {}

  @Post()
  @Log('start_cataloging')
  @UseInterceptors(FileInterceptor('medicalReport'))
  @ApiOperation({ summary: 'Inicia o formulário de catalogação' })
  @ApiResponse({ type: BaseResponse })
  async createCataloging(
    @Body() body: CreateCatalogingDto,
    @UploadedFile(
      new FileValidationPipe({
        maxSize: 4 * 1024 * 1024, // 4mb
        allowedMimeTypes: [
          MIME_TYPES.jpg,
          MIME_TYPES.jpeg,
          MIME_TYPES.png,
          MIME_TYPES.pdf,
        ],
      }),
    )
    medicalReport: Express.Multer.File,
  ): Promise<BaseResponse> {
    console.log({ body, medicalReport });

    await new Promise((resolve) => setTimeout(resolve, 2000));

    return {
      success: true,
      message: 'Formulário enviado com sucesso!',
    };
  }
}
