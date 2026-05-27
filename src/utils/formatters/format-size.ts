/**
 * Formats a size in bytes to a human-readable string.
 *
 * Supports: `b`, `kb`, `mb`
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${Math.round(bytes).toFixed(1)} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${Math.round(kb).toFixed(1)} KB`;
  }

  const mb = kb / 1024;

  return `${Math.round(mb).toFixed(1)} MB`;
}
