import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

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
    // Only proxy URLs from the known backend host to prevent open-proxy abuse.
    try {
      targetUrl = new URL(String(rawUrl));
    } catch {
      return new NextResponse('Invalid url parameter.', { status: 400 });
    }

    const ALLOWED_HOSTS = ['13.126.80.31', 'api.divineressha.com', 'divineressha.com'];
    if (!ALLOWED_HOSTS.some((host) => targetUrl.hostname === host)) {
      return new NextResponse('URL not allowed.', { status: 403 });
    }
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
