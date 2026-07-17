import crypto from 'node:crypto';
import { NextResponse } from 'next/server';

export const runtime = 'nodejs';

const razorpayKeySecret = process.env.RAZORPAY_KEY_SECRET;

type VerifyPaymentBody = {
  razorpay_order_id?: string;
  razorpay_payment_id?: string;
  razorpay_signature?: string;
};

export async function POST(request: Request) {
  try {
    if (!razorpayKeySecret) {
      return NextResponse.json({ detail: 'Razorpay credentials are not configured.' }, { status: 500 });
    }

    const body = (await request.json()) as VerifyPaymentBody;
    const orderId = body.razorpay_order_id?.trim();
    const paymentId = body.razorpay_payment_id?.trim();
    const signature = body.razorpay_signature?.trim();

    if (!orderId || !paymentId || !signature) {
      return NextResponse.json({ detail: 'Missing payment verification fields.' }, { status: 400 });
    }

    const expectedSignature = crypto.createHmac('sha256', razorpayKeySecret).update(`${orderId}|${paymentId}`).digest('hex');

    if (expectedSignature !== signature) {
      return NextResponse.json({ detail: 'Payment signature mismatch.', success: false }, { status: 400 });
    }

    return NextResponse.json({ success: true, message: 'Payment verified successfully.' });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to verify payment signature.' },
      { status: 500 }
    );
  }
}