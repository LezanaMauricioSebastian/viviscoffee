/**
 * Normalizes product/hero image paths for NgOptimizedImage.
 * Keeps absolute (http/https) and data URLs; prefixes local paths with assets/.
 */
export function resolveImageUrl(src: string | null | undefined): string {
  const value = (src ?? '').trim();
  if (!value) {
    return 'assets/fondo.jpeg';
  }
  if (/^https?:\/\//i.test(value) || value.startsWith('data:')) {
    return value;
  }
  const normalized = value.replace(/^\//, '');
  if (normalized.startsWith('assets/')) {
    return normalized;
  }
  return `assets/${normalized}`;
}
