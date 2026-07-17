import { NextResponse } from 'next/server';
import { AUTH_ENDPOINTS, BACKEND_API_URL } from '@/lib/constants/auth';

async function proxy(request: Request) {
  const payload = await request.json();

  const backendResponse = await fetch(`${BACKEND_API_URL}${AUTH_ENDPOINTS.resendVerification}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(payload),
  });

  const text = await backendResponse.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  const response = NextResponse.json(data, { status: backendResponse.status });
  const setCookie = backendResponse.headers.get('set-cookie');
  if (setCookie) {
    response.headers.set('set-cookie', setCookie);
  }

  return response;
}

export async function POST(request: Request) {
  try {
    return await proxy(request);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach verification service.' },
      { status: 500 }
    );
  }
}
