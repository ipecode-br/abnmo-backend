import type { QueueProcessedKeys } from '@/shared/queue/utils';

export interface SnsEnvelope {
  Type: string;
  MessageId: string;
  TopicArn?: string;
  Message: string;
  Timestamp?: string;
}

export interface WhatsAppStatusError {
  code?: number;
  title?: string;
  message?: string;
  error_data?: {
    details?: string;
  };
}

export interface WhatsAppStatus {
  id: string;
  status: string;
  timestamp?: string;
  recipient_id?: string;
  errors?: WhatsAppStatusError[];
}

export interface WhatsAppChange {
  field?: string;
  value: {
    messaging_product?: string;
    metadata?: {
      display_phone_number?: string;
      phone_number_id?: string;
    };
    statuses?: WhatsAppStatus[];
  };
}

export interface WhatsAppWebhookEntry {
  id?: string;
  changes: WhatsAppChange[];
}

export interface WhatsAppEvent {
  whatsAppWebhookEntry: string;
  messageId?: string;
  message_timestamp?: string;
}

export interface EventContext {
  sns: SnsEnvelope;
  processedKeys: QueueProcessedKeys;
}
