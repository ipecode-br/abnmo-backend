import { Document } from '@/domain/entities/document';
import { User } from '@/domain/entities/user';

import { documentFactory } from '../config/factories/document.factory';
import { getTestDataSource } from '../config/setup-e2e';

export async function createDocument(
  overrides: Partial<Document> & { user: User },
): Promise<Document> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Document);
  const document = repo.create(documentFactory(overrides));

  await repo.save(document);

  return document;
}

export async function getDocumentById(id: string): Promise<Document | null> {
  const dataSource = getTestDataSource();
  const repo = dataSource.getRepository(Document);
  return await repo.findOne({ where: { id } });
}
