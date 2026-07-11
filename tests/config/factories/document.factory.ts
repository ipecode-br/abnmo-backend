import { faker } from '@faker-js/faker';

import { Document } from '@/domain/entities/document';
import { User } from '@/domain/entities/user';
import {
  DOCUMENT_MIME_TYPES,
  DOCUMENT_STATUSES,
} from '@/domain/enums/documents';
import { getFileExtension } from '@/utils/get-file-extension';

import { baseEntityFactory } from './shared.factory';

export function documentFactory(
  user: User,
  overrides: Partial<Document> = {},
): Document {
  const mimeType = faker.helpers.arrayElement(DOCUMENT_MIME_TYPES);
  const extension = getFileExtension(mimeType);
  const filename = `laudo-${faker.string.alphanumeric(8)}.${extension}`;
  const key = `private/documents/patients/${user.id}/${filename}`;

  return {
    ...baseEntityFactory(),
    name: 'Laudo médico',
    filename,
    key,
    url: `${process.env.CDN_URL}/${key}`,
    size: faker.number.int({ min: 100_000, max: 5_000_000 }),
    mimeType,
    category: 'medical_report',
    status: faker.helpers.arrayElement(DOCUMENT_STATUSES),
    user,
    submission: null,
    ...overrides,
  };
}
