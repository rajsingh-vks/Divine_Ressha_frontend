import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const ORDER_PATHS = ['/orders', '/api/orders'];

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  let backendResponse: Response | null = null;

  for (const path of ORDER_PATHS) {
    const response = await fetch(`${BACKEND_API_URL}${path}/${encodeURIComponent(orderId)}/invoice`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    backendResponse = response;
    if (response.status !== 404 && response.status !== 405) break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach order invoice service.' }, { status: 502 });
  }

  const contentType = backendResponse.headers.get('content-type') || '';

  if (contentType.includes('application/pdf') || contentType.includes('application/octet-stream')) {
    const bytes = await backendResponse.arrayBuffer();
    return new NextResponse(bytes, {
      status: backendResponse.status,
      headers: {
        'Content-Type': contentType,
      },
    });
  }

  const text = await backendResponse.text();
  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}
