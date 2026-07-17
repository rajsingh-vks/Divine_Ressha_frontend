import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const ORDER_PATHS = ['/orders', '/api/orders'];
const TRACK_SUFFIXES = ['/track', '/tracking'];

export async function GET(request: Request, { params }: { params: Promise<{ orderId: string }> }) {
  const { orderId } = await params;

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of ORDER_PATHS) {
    for (const suffix of TRACK_SUFFIXES) {
      const response = await fetch(`${BACKEND_API_URL}${path}/${encodeURIComponent(orderId)}${suffix}`, {
        method: 'GET',
        headers,
        cache: 'no-store',
      });

      backendResponse = response;
      text = await response.text();

      if (response.status !== 404 && response.status !== 405) {
        let payload: unknown = {};
        try {
          payload = text ? JSON.parse(text) : {};
        } catch {
          payload = { message: text };
        }

        return NextResponse.json(payload, { status: backendResponse.status });
      }
    }
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach order tracking service.' }, { status: 502 });
  }

  return NextResponse.json({ detail: 'Order tracking endpoint not found.' }, { status: backendResponse.status });
}
