import { NextRequest, NextResponse } from 'next/server';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000';

export async function GET(
  request: NextRequest,
  { params }: { params: { refund_id: string } }
  
) {
  try {
    const authHeader = request.headers.get('Authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const refund_id = params.refund_id;

    const response = await fetch(
      `${API_BASE_URL}/payments/razorpay/refund/${refund_id}`,
      {
        method: 'GET',
        headers: {
          Authorization: authHeader,
        },
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return NextResponse.json(data, { status: response.status });
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
