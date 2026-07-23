export function getFileExtension(mimeType: string): string {
  const parts = mimeType.split('/');
  const extension = parts.pop() || '';
  return extension.toLowerCase();
}
