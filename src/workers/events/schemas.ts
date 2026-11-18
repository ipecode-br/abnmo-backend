import { z } from 'zod';

export const snsEnvelopeSchema = z.object({
  Type: z.string(),
  MessageId: z.string(),
  TopicArn: z.string().optional(),
  Message: z.string(),
  Timestamp: z.string().optional(),
});

export const whatsAppStatusErrorSchema = z.object({
  code: z.number().optional(),
  title: z.string().optional(),
  message: z.string().optional(),
  error_data: z
    .object({
      details: z.string().optional(),
    })
    .optional(),
});

export const whatsAppStatusSchema = z.object({
  id: z.string(),
  status: z.string(),
  timestamp: z.string().optional(),
  recipient_id: z.string().optional(),
  errors: z.array(whatsAppStatusErrorSchema).optional(),
});

export const whatsAppWebhookEntrySchema = z.object({
  id: z.string().optional(),
  changes: z.array(
    z.object({
      field: z.string().optional(),
      value: z.object({
        messaging_product: z.string().optional(),
        metadata: z
          .object({
            display_phone_number: z.string().optional(),
            phone_number_id: z.string().optional(),
          })
          .optional(),
        statuses: z.array(whatsAppStatusSchema).optional(),
      }),
    }),
  ),
});

export const whatsAppEventSchema = z.object({
  whatsAppWebhookEntry: z.string(),
  messageId: z.string().optional(),
  message_timestamp: z.string().optional(),
});
