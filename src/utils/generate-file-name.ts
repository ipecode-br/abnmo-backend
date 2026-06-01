import { randomUUID } from 'node:crypto';

import { normalizeString } from './normalize-string';

interface GenerateFileNameProps {
  originalName: string;
  replace?: string;
  prefix?: string;
}

export function generateFileName({
  originalName,
  replace,
  prefix,
}: GenerateFileNameProps): string {
  const parts = originalName.split('.');
  const extension = parts.pop();

  let fileName = normalizeString(parts.join());

  if (replace) {
    fileName = normalizeString(replace);
  }

  if (prefix) {
    fileName = `${prefix}_${fileName}`;
  }

  const truncatedName = fileName.substring(0, 40);
  const uuid = randomUUID();

  return `${truncatedName}_${uuid}.${extension}`;
}
