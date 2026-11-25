import {
  anonymizeCpf,
  anonymizeEmail,
  anonymizeName,
  anonymizePhone,
  anonymizePhoneE164,
} from './anonymize';

const PHONE_KEYS = new Set([
  'recipient_id',
  'wa_id',
  'recipient_participant_id',
  'to',
  'from',
  'phone',
]);

const ANONYMIZERS: Record<string, (value: string) => string> = {
  email: anonymizeEmail,
  name: anonymizeName,
  cpf: anonymizeCpf,
};

const JSON_STRING_KEYS = new Set(['Message', 'whatsAppWebhookEntry']);

const PHONE_JSON_PATTERN =
  /(\\?"(?:recipient_id|wa_id|recipient_participant_id|to|from|phone)\\?"\s*:\s*\\?")([^"\\]+)(\\?")/g;

function isPlainObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

function maskPhone(value: string): string {
  if (value.includes('@')) return anonymizeEmail(value);
  if (value.startsWith('+')) return anonymizePhoneE164(value);
  return anonymizePhone(value);
}

function maskPhoneFieldsInText(value: string): string {
  return value.replace(
    PHONE_JSON_PATTERN,
    (_match, prefix: string, phone: string, suffix: string) =>
      `${prefix}${maskPhone(phone)}${suffix}`,
  );
}

function tryParse(value: string): unknown {
  try {
    return JSON.parse(value) as unknown;
  } catch {
    return null;
  }
}

function sanitize(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(sanitize);
  if (!isPlainObject(value)) return value;

  return Object.fromEntries(
    Object.entries(value).map(([key, entryValue]) => {
      if (typeof entryValue !== 'string') {
        return [key, sanitize(entryValue)];
      }

      if (PHONE_KEYS.has(key)) return [key, maskPhone(entryValue)];

      const anonymizer = ANONYMIZERS[key];
      if (anonymizer) return [key, anonymizer(entryValue)];

      if (JSON_STRING_KEYS.has(key)) {
        const parsed = tryParse(entryValue);
        if (parsed !== null) return [key, JSON.stringify(sanitize(parsed))];
        return [key, maskPhoneFieldsInText(entryValue)];
      }

      return [key, entryValue];
    }),
  );
}

export function sanitizeBodyForSentry(body: string): unknown {
  const parsed = tryParse(body);
  if (parsed === null) return maskPhoneFieldsInText(body);
  return sanitize(parsed);
}
