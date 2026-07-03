import { z } from 'zod';

import {
  DOCUMENT_CATEGORIES,
  DOCUMENT_MIME_TYPES,
  DOCUMENT_STATUSES,
} from '@/domain/enums/documents';

import { baseEntitySchema } from '../base';

export const documentSchema = baseEntitySchema
  .extend({
    name: z.string().min(1).max(128),
    filename: z.string().min(1).max(256),
    key: z.string().min(1).max(512),
    url: z.string().url(),
    size: z.number().int().min(0),
    mimeType: z.enum(DOCUMENT_MIME_TYPES),
    category: z.enum(DOCUMENT_CATEGORIES),
    status: z.enum(DOCUMENT_STATUSES).default('pending'),
  })
  .strict();
export type DocumentSchema = z.infer<typeof documentSchema>;
