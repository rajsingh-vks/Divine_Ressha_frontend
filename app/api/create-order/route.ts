import Razorpay from 'razorpay';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const razorpayKeyId = process.env.RAZORPAY_KEY_ID;
const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

let razorpayClient: Razorpay | null = null;

const getRazorpayClient = () => {
  if (!razorpayKeyId || !razorpayKeySecret) {
    throw new Error('Razorpay credentials are not configured.');
  }

  if (!razorpayClient) {
    razorpayClient = new Razorpay({
      key_id: razorpayKeyId,
      key_secret: razorpayKeySecret,
    });
  }

  return razorpayClient;
};

type CreateOrderBody = {
  amount?: number;
  currency?: string;
  receipt?: string;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateOrderBody;
    const amount = Math.round(Number(body.amount ?? 0));
    const currency = typeof body.currency === 'string' && body.currency.trim() ? body.currency.trim().toUpperCase() : 'INR';
    const receipt = typeof body.receipt === 'string' && body.receipt.trim() ? body.receipt.trim() : `receipt_${Date.now()}`;

    if (!Number.isFinite(amount) || amount < 100) {
      return NextResponse.json({ detail: 'Amount must be at least 100 paise.' }, { status: 400 });
    }

    const order = await getRazorpayClient().orders.create({
      amount,
      currency,
      receipt,
    });

    return NextResponse.json({
      order_id: order.id,
      amount: order.amount,
      currency: order.currency,
      receipt: order.receipt,
    });
  } catch (error) {
    const statusCode = typeof error === 'object' && error && 'statusCode' in error ? Number((error as { statusCode?: number }).statusCode) : 500;
    const message = error instanceof Error ? error.message : 'Unable to create Razorpay order.';

    if (statusCode === 401) {
      return NextResponse.json({ detail: 'Razorpay authentication failed.' }, { status: 401 });
    }

    return NextResponse.json({ detail: message || 'Unable to create Razorpay order.' }, { status: 500 });
  }
}