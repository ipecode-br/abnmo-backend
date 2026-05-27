import { MIME_TYPES } from '@/constants/mime-types';

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
  isValid: boolean;
  extension: string;
  mimeType: string;
  message: string;
}

/**
 * Validates a file buffer against allowed extensions, size limits, and magic byte signatures.
 *
 * @param buffer - The raw file contents as a Buffer
 * @param maxSize - Maximum allowed file size **in bytes** (e.g. `5 * 1024 * 1024` for 5 MB)
 * @param fileName - Original file name including extension (e.g. `"document.pdf"`)
 * @param allowedExtensions - List of permitted extensions without leading dot (e.g. `["jpg", "png", "pdf"]`)
 *
 * @returns A {@link ValidateFileResult} with:
 * - `isValid` — `true` only if the extension, size, and magic bytes all pass
 * - `extension` — the detected extension from `fileName`
 * - `mimeType` — the detected mimeType from `extension`
 * - `message` — a human-readable result description (in Portuguese)
 *
 * @example
 * const result = validateFile({
 *   buffer: fileBuffer,
 *   maxSize: 5 * 1024 * 1024, // 5 MB
 *   fileName: 'photo.jpg',
 *   allowedExtensions: ['jpg', 'jpeg', 'png', 'pdf'],
 * });
 *
 * if (!result.isValid) {
 *   throw new Error(result.message);
 * }
 */
export function validateFile({
  buffer,
  maxSize,
  fileName,
  allowedExtensions,
}: ValidateFileProps): ValidateFileResult {
  const extension = getFileExtension(fileName);
  const mimeType = MIME_TYPES[extension];

  const baseResult = { isValid: false, extension, mimeType };

  if (!allowedExtensions.includes(extension)) {
    return {
      ...baseResult,
      message: `Formato de arquivo não permitido. Use: ${allowedExtensions.join(', ')}.`,
    };
  }

  if (buffer.length > maxSize) {
    return {
      ...baseResult,
      message: `Arquivo não pode ser maior que ${formatSize(maxSize)}.`,
    };
  }

  const expectedSignatures = MAGIC_BYTES[extension];

  if (!expectedSignatures) {
    return {
      ...baseResult,
      message: `Arquivo inválido. Por favor, envie um arquivo válido nos formatos: ${allowedExtensions.join(', ')}.`,
    };
  }

  const isValidSignature = expectedSignatures.some((signature) =>
    buffer.subarray(0, signature.length).equals(signature),
  );

  if (!isValidSignature) {
    return {
      ...baseResult,
      message: `Arquivo inválido. Por favor, envie um arquivo válido nos formatos: ${allowedExtensions.join(', ')}.`,
    };
  }

  return {
    ...baseResult,
    isValid: true,
    message: 'O arquivo enviado é válido.',
  };
}
