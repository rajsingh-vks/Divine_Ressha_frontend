import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const USER_PATHS = ['/users', '/api/users'];

async function proxy(request: Request) {
  const reqUrl = new URL(request.url);
  const query = reqUrl.search;

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of USER_PATHS) {
    const response = await fetch(`${BACKEND_API_URL}${path}${query}`, {
      method: 'GET',
      headers,
      cache: 'no-store',
    });

    backendResponse = response;
    text = await response.text();

    if (response.status !== 404 && response.status !== 405) break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach users service.' }, { status: 502 });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function GET(request: Request) {
  try {
    return await proxy(request);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach users service.' },
      { status: 500 }
    );
  }
}
