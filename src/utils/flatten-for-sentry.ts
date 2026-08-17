import {
  anonymizeCpf,
  anonymizeEmail,
  anonymizeName,
  anonymizePhone,
  anonymizePhoneE164,
} from './anonymize';

const PII_ANONYMIZERS: Record<string, (value: string) => string> = {
  email: anonymizeEmail,
  name: anonymizeName,
  phone: anonymizePhone,
  cpf: anonymizeCpf,
};

function sanitizeValue(key: string, value: unknown): unknown {
  if (PII_ANONYMIZERS[key] && typeof value === 'string') {
    if (key === 'phone' && value.startsWith('+')) {
      return anonymizePhoneE164(value);
    }
    return PII_ANONYMIZERS[key](value);
  }

  if (Array.isArray(value)) {
    return JSON.stringify(value);
  }

  return value;
}

export function flattenForSentry(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const entries = Object.entries(payload);
  return Object.fromEntries(
    entries.map(([key, value]) => [key, sanitizeValue(key, value)]),
  );
}
