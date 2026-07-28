import { NextResponse } from 'next/server';
import { AUTH_ENDPOINTS, BACKEND_API_URL } from '@/lib/constants/auth';

async function proxy(request: Request) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');
  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  const candidateBaseUrls = Array.from(
    new Set([BACKEND_API_URL, process.env.BACKEND_API_URL_FALLBACK, 'https://api.divineressha.com'].filter(Boolean))
  );

  const candidatePaths = [AUTH_ENDPOINTS.profile, `/api${AUTH_ENDPOINTS.profile}`];

  let backendResponse: Response | null = null;
  let text = '';

  for (const baseUrl of candidateBaseUrls) {
    for (const path of candidatePaths) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: request.method,
        headers,
        cache: 'no-store',
      });

      backendResponse = response;
      text = await response.text();

      if (response.status !== 404 && response.status !== 405) {
        break;
      }
    }

    if (backendResponse && backendResponse.status !== 404 && backendResponse.status !== 405) {
      break;
    }
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach profile service.' }, { status: 502 });
  }

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
    const candidateBaseUrls = Array.from(
      new Set([BACKEND_API_URL, process.env.BACKEND_API_URL_FALLBACK, 'https://api.divineressha.com'].filter(Boolean))
    );
    const candidatePaths = [AUTH_ENDPOINTS.profile, `/api${AUTH_ENDPOINTS.profile}`];

    let backendResponse: Response | null = null;
    let text = '';

    for (const baseUrl of candidateBaseUrls) {
      for (const path of candidatePaths) {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'PUT',
          headers,
          body,
          cache: 'no-store',
        });

        backendResponse = response;
        text = await response.text();

        if (response.status !== 404 && response.status !== 405) {
          break;
        }
      }

      if (backendResponse && backendResponse.status !== 404 && backendResponse.status !== 405) {
        break;
      }
    }

    if (!backendResponse) {
      return NextResponse.json({ detail: 'Unable to reach profile service.' }, { status: 502 });
    }

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
