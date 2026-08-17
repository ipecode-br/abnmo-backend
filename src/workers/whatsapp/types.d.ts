export interface WhatsAppTemplateMessage {
  name: string;
  language: string;
  components: Record<string, unknown>[];
}

export interface SendWhatsAppPayload {
  message: Uint8Array;
}
