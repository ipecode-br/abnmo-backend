export function getFileExtension(fileName: string): string {
  const parts = fileName.split('.');
  const extension = parts.length > 1 ? parts[parts.length - 1] : '';
  return extension.toLowerCase();
}
