/**
 * Normalizes a string:
 * - Converts to lowercase
 * - Replaces accented/special characters with ASCII equivalents
 * - Replaces spaces and non-alphanumeric characters with underscores
 * - Collapses consecutive underscores to single underscore
 * - Trims leading/trailing underscores
 */
export function normalizeString(str: string): string {
  // Convert to lowercase
  let normalized = str.toLowerCase();

  // Replace accented characters with ASCII equivalents
  normalized = normalized.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

  // Replace spaces and non-alphanumeric characters (except underscore) with underscore
  normalized = normalized.replace(/[^\w-]+/g, '_');

  // Collapse consecutive underscores to single underscore
  normalized = normalized.replace(/_+/g, '_');

  // Trim leading/trailing underscores
  normalized = normalized.replace(/^_+|_+$/g, '');

  return normalized;
}
