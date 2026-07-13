import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const ITEM_PATHS = ['/cart', '/api/cart'];

async function proxy(request: Request, itemId: string) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const isBodyMethod = !['GET', 'HEAD'].includes(request.method);
  if (isBodyMethod) {
    headers.set('Content-Type', 'application/json');
  }

  const init: RequestInit = {
    method: request.method,
    headers,
    cache: 'no-store',
  };

  const rawBody = isBodyMethod ? await request.text() : undefined;
  if (isBodyMethod) {
    init.body = rawBody;
  }

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of ITEM_PATHS) {
    const url = `${BACKEND_API_URL}${path}/${encodeURIComponent(itemId)}`;
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

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return proxy(request, itemId);
}

export async function PUT(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return proxy(request, itemId);
}

export async function GET(request: Request, { params }: { params: Promise<{ itemId: string }> }) {
  const { itemId } = await params;
  return proxy(request, itemId);
}
