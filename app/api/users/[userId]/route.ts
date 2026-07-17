import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const USER_PATHS = ['/users', '/api/users'];

async function proxy(request: Request, userId: string) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  let backendResponse: Response | null = null;
  let text = '';

  for (const path of USER_PATHS) {
    const response = await fetch(`${BACKEND_API_URL}${path}/${encodeURIComponent(userId)}`, {
      method: request.method,
      headers,
      cache: 'no-store',
    });

    backendResponse = response;
    text = await response.text();

    if (response.status !== 404 && response.status !== 405) break;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach user service.' }, { status: 502 });
  }

  if (backendResponse.status === 204 || backendResponse.status === 205) {
    return new NextResponse(null, { status: backendResponse.status });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ userId: string }> }) {
  try {
    const { userId } = await params;
    return await proxy(request, userId);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach user service.' },
      { status: 500 }
    );
  }
}
