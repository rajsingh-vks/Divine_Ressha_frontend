import { NextResponse } from 'next/server';
import { AUTH_ENDPOINTS, BACKEND_API_URL } from '@/lib/constants/auth';

async function proxy(request: Request) {
  const payload = await request.json();

  const candidatePaths = [AUTH_ENDPOINTS.signupInitiate, `/api${AUTH_ENDPOINTS.signupInitiate}`];

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of candidatePaths) {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    });

    backendResponse = response;
    text = await response.text();

    if (response.status !== 404 && response.status !== 405) break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach signup service.' }, { status: 502 });
  }

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
      { detail: error instanceof Error ? error.message : 'Unable to reach signup service.' },
      { status: 500 }
    );
  }
}
