export const MAX_SURVEY_DOCUMENT_FILE_SIZE = 6 * 1024 * 1024; // 6mb

export const MIME_TYPES = {
  jpeg: 'image/jpeg',
  jpg: 'image/jpg',
  png: 'image/png',
  pdf: 'application/pdf',
} as const;
export type MimeType = (typeof MIME_TYPES)[keyof typeof MIME_TYPES];

export const MAGIC_BYTES: Record<string, Buffer[]> = {
  'image/jpg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/jpeg': [Buffer.from([0xff, 0xd8, 0xff])],
  'image/png': [Buffer.from([0x89, 0x50, 0x4e, 0x47])],
  'application/pdf': [Buffer.from([0x25, 0x50, 0x44, 0x46])],
};

export const STORAGE_FOLDERS = {
  users: {
    avatars: 'private/users/avatars',
  },
  patients: {
    avatars: 'private/patients/avatars',
    documents: (id: string) => `private/patients/documents/${id}`,
  },
};
