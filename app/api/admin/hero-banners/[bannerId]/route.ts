import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const READ_ITEM_PATHS = [
  '/api/hero-banners',
  '/hero-banners',
  '/api/admin/hero-banners',
  '/admin/hero-banners',
];

const WRITE_ITEM_PATHS = [
  '/api/hero-banners',
  '/hero-banners',
  '/api/admin/hero-banners',
  '/admin/hero-banners',
];

const BACKEND_BASE_URLS = Array.from(
  new Set([
    process.env.BACKEND_HERO_BANNERS_API_URL,
    BACKEND_API_URL,
    process.env.BACKEND_API_URL_FALLBACK,
    'http://127.0.0.1:8000',
    'http://localhost:8000',
    'http://127.0.0.1:8001',
    'http://localhost:8001',
    'https://api.divineressha.com',
  ].filter(Boolean))
);

async function proxy(request: Request, bannerId: string) {
  const reqUrl = new URL(request.url);
  const query = reqUrl.search;
  const targetPaths = request.method === 'GET' ? READ_ITEM_PATHS : WRITE_ITEM_PATHS;

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  const contentType = request.headers.get('content-type');

  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const isBodyMethod = !['GET', 'HEAD'].includes(request.method);
  if (isBodyMethod && contentType) headers.set('content-type', contentType);

  const rawBody = isBodyMethod ? await request.arrayBuffer() : undefined;

  let backendResponse: Response | null = null;
  let text = '';

  for (const baseUrl of BACKEND_BASE_URLS) {
    for (const basePath of targetPaths) {
      const url = `${baseUrl}${basePath}/${encodeURIComponent(bannerId)}${query}`;
      let response: Response;
      try {
        response = await fetch(url, {
          method: request.method,
          headers,
          body: isBodyMethod && rawBody ? rawBody : undefined,
          cache: 'no-store',
        });
      } catch {
        continue;
      }

      backendResponse = response;
      text = await response.text();

      if (response.status !== 404 && response.status !== 405) {
        break;
      }
    }

    if (backendResponse && backendResponse.status !== 404 && backendResponse.status !== 405) {
      break;
    }
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach hero banner service.' }, { status: 502 });
  }

  if (backendResponse.status === 204 || backendResponse.status === 205) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ bannerId: string }> }) {
  const { bannerId } = await params;
  return proxy(request, bannerId);
}

export async function PUT(request: Request, { params }: { params: Promise<{ bannerId: string }> }) {
  const { bannerId } = await params;
  return proxy(request, bannerId);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ bannerId: string }> }) {
  const { bannerId } = await params;
  return proxy(request, bannerId);
}
