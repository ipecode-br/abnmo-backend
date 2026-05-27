import { formatSize } from './formatters/format-size';
import { getFileExtension } from './get-file-extension';

const MAGIC_BYTES: Record<string, Buffer[]> = {
  jpg: [Buffer.from([0xff, 0xd8, 0xff])],
  jpeg: [Buffer.from([0xff, 0xd8, 0xff])],
  png: [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  pdf: [Buffer.from([0x25, 0x50, 0x44, 0x46])],
};

interface ValidateFileProps {
  buffer: Buffer;
  maxSize: number;
  fileName: string;
  allowedExtensions: string[];
}

interface ValidateFileResult {
  extension: string;
  isValid: boolean;
  message: string;
}

export function validateFile({
  buffer,
  maxSize,
  fileName,
  allowedExtensions,
}: ValidateFileProps): ValidateFileResult {
  const extension = getFileExtension(fileName);

  if (!allowedExtensions.includes(extension)) {
    return {
      extension,
      isValid: false,
      message: `Formato de arquivo não permitido. Use: ${allowedExtensions.join(', ')}.`,
    };
  }

  if (buffer.length > maxSize) {
    return {
      extension,
      isValid: false,
      message: `Arquivo não pode ser maior que ${formatSize(maxSize)}.`,
    };
  }

  const expectedSignatures = MAGIC_BYTES[extension];

  if (!expectedSignatures) {
    return {
      extension,
      isValid: false,
      message: `Arquivo inválido. Por favor, envie um arquivo válido nos formatos: ${allowedExtensions.join(', ')}.`,
    };
  }

  const isValidSignature = expectedSignatures.some((signature) =>
    buffer.subarray(0, signature.length).equals(signature),
  );

  if (!isValidSignature) {
    return {
      extension,
      isValid: false,
      message: `Arquivo inválido. Por favor, envie um arquivo válido nos formatos: ${allowedExtensions.join(', ')}.`,
    };
  }

  return { extension, isValid: true, message: 'O arquivo enviado é válido.' };
}
