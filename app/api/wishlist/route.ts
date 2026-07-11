import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const WISHLIST_COLLECTION_PATHS = ['/wishlist', '/api/wishlist'];

const extractProductId = (rawBody: string | undefined) => {
  if (!rawBody) return '';

  try {
    const parsed = JSON.parse(rawBody) as {
      id?: string | number;
      productId?: string | number;
      product_id?: string | number;
    };

    return String(parsed.productId ?? parsed.product_id ?? parsed.id ?? '');
  } catch {
    return '';
  }
};

const buildWishlistPaths = (method: string, productId: string) => {
  if ((method === 'POST' || method === 'DELETE') && productId) {
    return [`/wishlist/${encodeURIComponent(productId)}`, ...WISHLIST_COLLECTION_PATHS];
  }

  return WISHLIST_COLLECTION_PATHS;
};

async function proxy(request: Request) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  if (request.method !== 'GET') {
    headers.set('Content-Type', 'application/json');
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  const rawBody = request.method !== 'GET' && request.method !== 'HEAD' ? await request.text() : undefined;
  const productId = extractProductId(rawBody);
  const candidatePaths = buildWishlistPaths(request.method, productId);

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = rawBody;
  }

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of candidatePaths) {
    if (path.startsWith('/wishlist/') && (request.method === 'POST' || request.method === 'DELETE')) {
      delete init.body;
    } else if (request.method !== 'GET' && request.method !== 'HEAD') {
      init.body = rawBody;
    }

    const url = `${BACKEND_API_URL}${path}`;
    const response = await fetch(url, init);

    if (response.status === 404 || response.status === 405) {
      backendResponse = response;
      text = await response.text();
      continue;
    }

    backendResponse = response;
    text = await response.text();
    break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach wishlist backend.' }, { status: 502 });
  }

  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  return NextResponse.json(data, { status: backendResponse.status });
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function POST(request: Request) {
  return proxy(request);
}

export async function DELETE(request: Request) {
  return proxy(request);
}
