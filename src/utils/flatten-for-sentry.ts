export function flattenForSentry(
  payload: Record<string, unknown>,
): Record<string, unknown> {
  const entries = Object.entries(payload);
  return Object.fromEntries(
    entries.map(([key, value]) => [
      key,
      Array.isArray(value) ? JSON.stringify(value) : value,
    ]),
  );
}
