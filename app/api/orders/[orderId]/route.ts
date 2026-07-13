import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const ORDER_PATHS = ['/orders', '/api/orders'];

async function proxy(request: Request, orderId: string) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of ORDER_PATHS) {
    const response = await fetch(`${BACKEND_API_URL}${path}/${encodeURIComponent(orderId)}`, {
      method: request.method,
      headers,
      cache: 'no-store',
    });

    backendResponse = response;
    text = await response.text();

    if (response.status !== 404 && response.status !== 405) break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach order service.' }, { status: 502 });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;
  return proxy(request, orderId);
}
