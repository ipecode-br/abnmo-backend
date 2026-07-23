import { DocumentMimeType } from '@/domain/enums/documents';

export const MAX_SURVEY_DOCUMENT_FILE_SIZE = 6 * 1024 * 1024; // 6mb

export const MIME_TYPES: Record<string, DocumentMimeType> = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpg',
  png: 'image/png',
  pdf: 'application/pdf',
} as const;

export const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
};

export const STORAGE_FOLDERS = {
  users: {
    avatarsRoot: 'private/avatars/users',
    avatars: (id: string) => `private/avatars/users/${id}`,
  },
  patients: {
    avatarsRoot: 'private/avatars/patients',
    avatars: (id: string) => `private/avatars/patients/${id}`,
    documentsRoot: 'private/documents/patients',
    documents: (id: string) => `private/documents/patients/${id}`,
  },
};
