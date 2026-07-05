import { faker } from '@faker-js/faker';
import dataSource from 'infra/database/data.source';
import type { DeepPartial } from 'typeorm';

import { Document } from '@/domain/entities/document';
import { DOCUMENT_MIME_TYPES } from '@/domain/enums/documents';
import { getFileExtension } from '@/utils/get-file-extension';

import { generateFakeDate } from './generate-fakes';

export function generateFakeDocument(
  data: {
    user: { id: string };
    submission: { id: string };
  } & DeepPartial<Document>,
): Document {
  const repository = dataSource.getRepository(Document);

  const key = `private/documents/patients/${data.user.id}/${faker.string.uuid()}-laudo.pdf`;

  const mimeType = faker.helpers.arrayElement(DOCUMENT_MIME_TYPES);
  const extension = getFileExtension(mimeType);

  const baseData: DeepPartial<Document> = {
    name: 'Laudo Médico',
    filename: `laudo-${faker.string.alphanumeric(8)}.${extension}`,
    key,
    url: `${process.env.CDN_URL}/${key}`,
    size: faker.number.int({ min: 100_000, max: 5_000_000 }),
    mimeType,
    category: 'medical_report',
    status: 'confirmed',
    createdAt: generateFakeDate(),
  };

  return repository.create({ ...baseData, ...data });
}
