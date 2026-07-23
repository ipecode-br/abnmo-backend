import { randomUUID } from 'node:crypto';

import { getFileExtension } from './get-file-extension';
import { normalizeString } from './normalize-string';

interface GenerateFileNameProps {
  mimeType: string;
  prefix?: string;
  name?: string;
}

export function generateFileName({
  mimeType,
  prefix,
  name,
}: GenerateFileNameProps): string {
  const extension = getFileExtension(mimeType);

  let fileName = name ? normalizeString(name) : '';

  if (prefix) {
    const separator = fileName ? '_' : '';
    fileName = `${prefix}${separator}${fileName}`;
  }

  const truncatedName = fileName.substring(0, 40);
  const uuid = randomUUID();

  return `${truncatedName}_${uuid}.${extension}`;
}
