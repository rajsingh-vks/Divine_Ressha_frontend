import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const ITEM_PATHS = [
  (id: string) => `/api/admin/ritual-showcase/${id}`,
  (id: string) => `/admin/ritual-showcase/${id}`,
  (id: string) => `/api/ritual-showcase/${id}`,
  (id: string) => `/ritual-showcase/${id}`,
];

const normalizeBase = (value?: string | null) => (value || '').trim().replace(/\/+$/, '');

const isAbsoluteHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const BACKEND_BASE_URLS = Array.from(
  new Set(
    [
      process.env.BACKEND_RITUAL_SHOWCASE_API_URL,
      BACKEND_API_URL,
      process.env.BACKEND_API_URL_FALLBACK,
      process.env.NEXT_PUBLIC_API_URL,
      'http://127.0.0.1:8000',
      'http://localhost:8000',
      'http://127.0.0.1:8001',
      'http://localhost:8001',
      'https://api.divineressha.com',
    ]
      .map((value) => normalizeBase(value))
      .filter((value) => value && isAbsoluteHttpUrl(value))
  )
);

async function proxy(request: Request, itemId: string) {
  const reqUrl = new URL(request.url);
  const query = reqUrl.search;

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
    for (const pathBuilder of ITEM_PATHS) {
      const targetUrl = `${baseUrl}${pathBuilder(itemId)}${query}`;
      let response: Response;
      try {
        response = await fetch(targetUrl, {
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
    return NextResponse.json({ detail: 'Unable to reach ritual showcase service.' }, { status: 502 });
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

type RouteContext = {
  params: {
    itemId: string;
  };
};

export async function PATCH(request: Request, context: RouteContext) {
  return proxy(request, context.params.itemId);
}

export async function PUT(request: Request, context: RouteContext) {
  return proxy(request, context.params.itemId);
}

export async function DELETE(request: Request, context: RouteContext) {
  return proxy(request, context.params.itemId);
}
