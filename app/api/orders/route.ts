import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const ORDER_PATHS = ['/orders', '/api/orders'];

async function proxy(request: Request) {
  const reqUrl = new URL(request.url);
  const query = reqUrl.search;

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const isBodyMethod = !['GET', 'HEAD'].includes(request.method);
  const rawBody = isBodyMethod ? await request.text() : undefined;
  if (isBodyMethod) headers.set('content-type', 'application/json');

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of ORDER_PATHS) {
    const response = await fetch(`${BACKEND_API_URL}${path}${query}`, {
      method: request.method,
      headers,
      body: isBodyMethod ? rawBody : undefined,
      cache: 'no-store',
    });

    backendResponse = response;
    text = await response.text();

    if (response.status !== 404 && response.status !== 405) break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach orders service.' }, { status: 502 });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function GET(request: Request) {
  return proxy(request);
}

export async function POST(request: Request) {
  return proxy(request);
}
