/**
 * Formats a size in bytes to a human-readable string.
 *
 * Supports: `b`, `kb`, `mb`
 */
export function formatSize(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }

  const kb = bytes / 1024;

  if (kb < 1024) {
    return `${Math.round(kb * 10) / 10} KB`;
  }

  const mb = kb / 1024;

  return `${Math.round(mb * 10) / 10} MB`;
}
