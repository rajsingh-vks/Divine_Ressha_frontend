import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const MEDIA_RESOLVER_BASES = Array.from(
  new Set([
    process.env.BACKEND_HERO_BANNERS_API_URL,
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    BACKEND_API_URL,
    process.env.BACKEND_API_URL_FALLBACK,
    'https://api.divineressha.com',
  ].filter(Boolean))
);

/**
 * Proxy external backend media (images) through HTTPS so that
 * mixed-content errors are avoided when the frontend is served over HTTPS.
 *
 * Usage: /api/media?url=http%3A%2F%2F13.126.80.31%2F...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');
  const rawPath = searchParams.get('path');

  if (!rawUrl && !rawPath) {
    return new NextResponse('Missing url or path parameter.', { status: 400 });
  }

  let targetUrl: URL;

  if (rawPath) {
    const allowedRelativePrefixes = ['/media/', '/api/media/'];
    if (!allowedRelativePrefixes.some((prefix) => rawPath.startsWith(prefix))) {
      return new NextResponse('Path not allowed.', { status: 403 });
    }

    try {
      targetUrl = new URL(rawPath, BACKEND_API_URL);
    } catch {
      return new NextResponse('Invalid path parameter.', { status: 400 });
    }
  } else {
    // Validate URL shape, then let backend resolver handle external mapping/signing.
    try {
      targetUrl = new URL(String(rawUrl));
    } catch {
      return new NextResponse('Invalid url parameter.', { status: 400 });
    }

    // Unwrap nested proxy URLs: /api/media?url=https://.../api/media?url=<s3>
    if (
      /^(www\.)?divineressha\.com$/i.test(targetUrl.hostname) &&
      targetUrl.pathname.replace(/\/+$/, '') === '/api/media'
    ) {
      const inner = targetUrl.searchParams.get('url');
      if (inner) {
        try {
          targetUrl = new URL(inner);
        } catch {
          return new NextResponse('Invalid nested media url parameter.', { status: 400 });
        }
      }
    }

    const ALLOWED_HOSTS = [
      '13.126.80.31',
      'api.divineressha.com',
      'divineressha.com',
      'divine-reesha-assets.s3.ap-south-1.amazonaws.com',
    ];
    if (!ALLOWED_HOSTS.some((host) => targetUrl.hostname === host)) {
      return new NextResponse('URL not allowed.', { status: 403 });
    }

    // Backend supports /api/media?url=<http|https>; keep behavior as redirect pass-through.
    let resolverResponse: Response | null = null;

    for (const baseUrl of MEDIA_RESOLVER_BASES) {
      try {
        const resolverUrl = new URL('/api/media', String(baseUrl));
        resolverUrl.searchParams.set('url', targetUrl.toString());

        const response = await fetch(resolverUrl.toString(), {
          method: 'GET',
          cache: 'no-store',
          redirect: 'manual',
          headers: {
            'User-Agent': 'DivineRessha-Proxy/1.0',
          },
        });

        resolverResponse = response;

        if (response.status >= 300 && response.status < 400) {
          const location = response.headers.get('location');
          if (location) {
            const normalizedLocation = location.replace('/api/media/?url=', '/api/media?url=');

            try {
              const redirectUrl = new URL(normalizedLocation, String(baseUrl));
              const redirectPath = redirectUrl.pathname.replace(/\/+$/, '');
              const nestedUrl = redirectUrl.searchParams.get('url');

              // Backend loop guard: /api/media?url=<...> -> unwrap and continue resolving.
              if (redirectPath === '/api/media' && nestedUrl) {
                try {
                  targetUrl = new URL(nestedUrl);
                  continue;
                } catch {
                  // fallback to redirect below
                }
              }

              // If redirected to the final asset URL, fetch bytes and return response.
              const redirectedAsset = await fetch(redirectUrl.toString(), {
                method: 'GET',
                cache: 'no-store',
                headers: {
                  'User-Agent': 'DivineRessha-Proxy/1.0',
                },
              });

              if (redirectedAsset.ok) {
                const contentType = redirectedAsset.headers.get('content-type') || 'image/jpeg';
                const body = await redirectedAsset.arrayBuffer();

                return new NextResponse(body, {
                  status: 200,
                  headers: {
                    'Content-Type': contentType,
                    'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
                    'Access-Control-Allow-Origin': '*',
                  },
                });
              }
            } catch {
              // fallback to redirect
            }

            return NextResponse.redirect(normalizedLocation, response.status);
          }
        }

        if (response.ok) {
          const contentType = response.headers.get('content-type') || 'image/jpeg';
          const body = await response.arrayBuffer();

          return new NextResponse(body, {
            status: 200,
            headers: {
              'Content-Type': contentType,
              'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
              'Access-Control-Allow-Origin': '*',
            },
          });
        }
      } catch {
        // try next backend base
      }
    }

    return new NextResponse(
      resolverResponse ? 'Upstream image not found.' : 'Failed to resolve media URL.',
      { status: resolverResponse?.status || 502 }
    );
  }

  try {
    const upstream = await fetch(targetUrl.toString(), {
      method: 'GET',
      cache: 'no-store',
      headers: {
        'User-Agent': 'DivineRessha-Proxy/1.0',
      },
    });

    if (!upstream.ok) {
      return new NextResponse('Upstream image not found.', { status: upstream.status });
    }

    const contentType = upstream.headers.get('content-type') || 'image/jpeg';
    const body = await upstream.arrayBuffer();

    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=86400, stale-while-revalidate=604800',
        'Access-Control-Allow-Origin': '*',
      },
    });
  } catch {
    return new NextResponse('Failed to fetch upstream image.', { status: 502 });
  }
}
