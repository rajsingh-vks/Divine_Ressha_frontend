/**
 * Rewrites backend HTTP image URLs to go through /api/media proxy,
 * avoiding mixed-content errors on HTTPS pages.
 *
 * Backend returns: http://13.126.80.31/api/media/products/...
 * This function returns: /api/media?url=http%3A%2F%2F13.126.80.31%2F...
 */
export function proxyImageUrl(url: string | null | undefined, fallback = '/images/banner_main.jpeg'): string {
  if (!url) return fallback;

  const normalizeEncodedMediaUrl = (input: string) => {
    let normalized = input.trim();

    if (!normalized) return '';

    if (normalized.startsWith('file:///')) {
      normalized = normalized.replace(/^file:\/\//, '');
    }

    for (let i = 0; i < 2; i += 1) {
      try {
        const decoded = decodeURIComponent(normalized);
        if (decoded === normalized) break;
        normalized = decoded;
      } catch {
        break;
      }
    }

    if (normalized.startsWith('api/media?url=')) {
      normalized = `/${normalized}`;
    }

    if (normalized.startsWith('/api/media?url=')) {
      return normalized;
    }

    return normalized;
  };

  url = normalizeEncodedMediaUrl(url);

  // Normalize absolute app proxy URLs to same-origin route.
  if (/^https?:\/\/(www\.)?divineressha\.com\/api\/media\?url=/i.test(url)) {
    try {
      const parsed = new URL(url);
      const inner = parsed.searchParams.get('url');
      if (inner) {
        return `/api/media?url=${encodeURIComponent(inner)}`;
      }
      return '/api/media';
    } catch {
      return url;
    }
  }

  const S3_HOSTS = ['divine-reesha-assets.s3.ap-south-1.amazonaws.com'];
  const shouldProxyS3Url = S3_HOSTS.some((host) => url.includes(host));

  // Backend-relative media paths should also be proxied.
  if (url.startsWith('/media/') || url.startsWith('/api/media/')) {
    return `/api/media?path=${encodeURIComponent(url)}`;
  }

  // AWS S3 assets may require proxying for consistent access behavior.
  if (shouldProxyS3Url) {
    return `/api/media?url=${encodeURIComponent(url)}`;
  }

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
