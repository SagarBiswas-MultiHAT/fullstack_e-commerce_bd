export function sanitizeHtml(input: string): string {
  if (!input) {
    return '';
  }

  return input.replace(/<[^>]*>/g, '').trim();
}

export function sanitizeFilename(name: string): string {
  if (!name) {
    return '';
  }

  return name
    .replace(/\.\.(\/|\\)/g, '')
    .replace(/[\\/]/g, '-')
    .replace(/[^a-zA-Z0-9._-]/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}
