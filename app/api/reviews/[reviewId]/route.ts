import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const REVIEW_PATHS = ['/reviews', '/api/reviews'];

async function proxy(request: Request, reviewId: string) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  const contentType = request.headers.get('content-type');
  const acceptHeader = request.headers.get('accept');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  if (contentType) headers.set('content-type', contentType);
  if (acceptHeader) headers.set('accept', acceptHeader);
  headers.set('accept', 'application/json');

  const isBodyMethod = !['GET', 'HEAD', 'DELETE'].includes(request.method);
  const rawBody = isBodyMethod ? await request.text() : undefined;
  if (isBodyMethod && !headers.has('content-type')) headers.set('content-type', 'application/json');
  if (!isBodyMethod && !headers.has('content-type')) headers.set('content-type', 'application/json');

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of REVIEW_PATHS) {
    const response = await fetch(`${BACKEND_API_URL}${path}/${encodeURIComponent(reviewId)}`, {
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
    return NextResponse.json({ detail: 'Unable to reach reviews service.' }, { status: 502 });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function GET(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return proxy(request, reviewId);
}

export async function PUT(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return proxy(request, reviewId);
}

export async function DELETE(request: Request, { params }: { params: Promise<{ reviewId: string }> }) {
  const { reviewId } = await params;
  return proxy(request, reviewId);
}
