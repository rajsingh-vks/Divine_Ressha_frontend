import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const CART_PATHS = ['/api/cart', '/cart'];

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
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    init.body = rawBody;
  }

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of CART_PATHS) {
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
    return NextResponse.json({ detail: 'Unable to reach cart backend.' }, { status: 502 });
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
