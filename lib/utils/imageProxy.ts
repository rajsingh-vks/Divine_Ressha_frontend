/**
 * Rewrites backend HTTP image URLs to go through /api/media proxy,
 * avoiding mixed-content errors on HTTPS pages.
 *
 * Backend returns: http://13.126.80.31/api/media/products/...
 * This function returns: /api/media?url=http%3A%2F%2F13.126.80.31%2F...
 */
export function proxyImageUrl(url: string | null | undefined, fallback = '/images/banner.jpg'): string {
  if (!url) return fallback;

  // Already relative or HTTPS – no proxy needed.
  if (url.startsWith('/') || url.startsWith('https://') || url.startsWith('data:')) {
    return url;
  }

  // Rewrite HTTP backend URLs through the local media proxy.
  if (url.startsWith('http://')) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }

  return url;
}
