import { NextResponse } from 'next/server';

/**
 * Proxy external backend media (images) through HTTPS so that
 * mixed-content errors are avoided when the frontend is served over HTTPS.
 *
 * Usage: /api/media?url=http%3A%2F%2F13.126.80.31%2F...
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const rawUrl = searchParams.get('url');

  if (!rawUrl) {
    return new NextResponse('Missing url parameter.', { status: 400 });
  }

  // Only proxy URLs from the known backend host to prevent open-proxy abuse.
  let targetUrl: URL;
  try {
    targetUrl = new URL(rawUrl);
  } catch {
    return new NextResponse('Invalid url parameter.', { status: 400 });
  }

  const ALLOWED_HOSTS = ['13.126.80.31', 'api.divineressha.com', 'divineressha.com'];
  if (!ALLOWED_HOSTS.some((host) => targetUrl.hostname === host)) {
    return new NextResponse('URL not allowed.', { status: 403 });
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
