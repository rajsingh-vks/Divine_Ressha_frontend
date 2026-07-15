import { NextResponse } from 'next/server';
import { AUTH_ENDPOINTS, BACKEND_API_URL } from '@/lib/constants/auth';

async function proxy(request: Request) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const backendResponse = await fetch(`${BACKEND_API_URL}${AUTH_ENDPOINTS.profile}`, {
    method: request.method,
    headers,
    cache: 'no-store',
  });

  const text = await backendResponse.text();
  let data: unknown = {};

  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  return NextResponse.json(data, { status: backendResponse.status });
}

export async function GET(request: Request) {
  try {
    return await proxy(request);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach profile service.' },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const headers = new Headers();
    const authHeader = request.headers.get('authorization');
    const cookieHeader = request.headers.get('cookie');
    const contentType = request.headers.get('content-type');
    if (authHeader) headers.set('authorization', authHeader);
    if (cookieHeader) headers.set('cookie', cookieHeader);
    if (contentType) headers.set('content-type', contentType);

    const body = await request.text();
    const backendResponse = await fetch(`${BACKEND_API_URL}${AUTH_ENDPOINTS.profile}`, {
      method: 'PUT',
      headers,
      body,
      cache: 'no-store',
    });

    const text = await backendResponse.text();
    let data: unknown = {};

    try {
      data = text ? JSON.parse(text) : {};
    } catch {
      data = { message: text };
    }

    return NextResponse.json(data, { status: backendResponse.status });
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach profile service.' },
      { status: 500 }
    );
  }
}
