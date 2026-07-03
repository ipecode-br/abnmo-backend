export const DOCUMENT_MIME_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'application/pdf',
] as const;
export type DocumentMimeType = (typeof DOCUMENT_MIME_TYPES)[number];

export const DOCUMENT_CATEGORIES = ['avatar', 'medical_report'] as const;
export type DocumentCategory = (typeof DOCUMENT_CATEGORIES)[number];

export const DOCUMENT_STATUSES = ['pending', 'confirmed'] as const;
export type DocumentStatus = (typeof DOCUMENT_STATUSES)[number];
