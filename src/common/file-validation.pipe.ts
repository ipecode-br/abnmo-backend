import { BadRequestException, Injectable, PipeTransform } from '@nestjs/common';

import { formatSize } from '@/utils/formatters/format-size';

interface FileValidationPipeOptions {
  allowedMimeTypes: string[];
  maxSize: number;
}

@Injectable()
export class FileValidationPipe implements PipeTransform {
  constructor(private readonly options: FileValidationPipeOptions) {}

  transform(file: Express.Multer.File) {
    const { allowedMimeTypes, maxSize } = this.options;

    if (!allowedMimeTypes.includes(file.mimetype)) {
      const formattedAllowedTypes = allowedMimeTypes
        .map((mimeType) => {
          const extension = mimeType.split('/')[1];
          return extension.toUpperCase();
        })
        .join(', ');

      console.log(formattedAllowedTypes);

      throw new BadRequestException(
        `O arquivo enviado é inválido. Por favor, envie em um dos seguintes formatos: ${formattedAllowedTypes}.`,
      );
    }

    if (file.size > maxSize) {
      throw new BadRequestException(
        `O arquivo deve ser menor que ${formatSize(maxSize)}.`,
      );
    }

    return file;
  }
}
