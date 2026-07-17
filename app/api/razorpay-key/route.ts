import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

export async function GET() {
  const keyId = process.env.RAZORPAY_KEY_ID || process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

  if (!keyId) {
    return NextResponse.json({ detail: 'Razorpay key is not configured.' }, { status: 500 });
  }

  return NextResponse.json({ key_id: keyId });
}
