import { NextRequest, NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const PAYMENT_PATHS = ['/payments', '/api/payments'];

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ refund_id: string }> }
) {
  try {
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { refund_id } = await params;
    let backendResponse: Response | null = null;
    let text = '';

    for (const path of PAYMENT_PATHS) {
      const response = await fetch(
        `${BACKEND_API_URL}${path}/razorpay/refund/${encodeURIComponent(refund_id)}`,
        {
        method: 'GET',
        headers: {
            authorization: authHeader,
            ...(cookieHeader ? { cookie: cookieHeader } : {}),
        },
          cache: 'no-store',
        }
      );

      backendResponse = response;
      text = await response.text();

      if (response.status !== 404 && response.status !== 405) break;
    }

    if (!backendResponse) {
      return NextResponse.json({ detail: 'Unable to reach refund status service.' }, { status: 502 });
    }

    let data: unknown = {};
    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    if (!backendResponse.ok) {
      return NextResponse.json(data, { status: backendResponse.status });
    }

    return NextResponse.json(data, { status: 200 });
  } catch (error) {
    console.error('Razorpay refund status proxy error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch refund status' },
      { status: 500 }
    );
  }
}
