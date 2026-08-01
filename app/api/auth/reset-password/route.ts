import { NextResponse } from 'next/server';
import { AUTH_ENDPOINTS, BACKEND_API_URL } from '@/lib/constants/auth';

async function proxy(request: Request) {
  const payload = await request.json();

  const candidateBaseUrls = Array.from(
    new Set([BACKEND_API_URL, process.env.BACKEND_API_URL_FALLBACK, 'https://api.divineressha.com'].filter(Boolean))
  );
  const candidatePaths = [AUTH_ENDPOINTS.resetPassword, `/api${AUTH_ENDPOINTS.resetPassword}`];

  let backendResponse: Response | null = null;
  let text = '';

  for (const baseUrl of candidateBaseUrls) {
    for (const path of candidatePaths) {
      const response = await fetch(`${baseUrl}${path}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
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
    return NextResponse.json({ detail: 'Unable to reach password service.' }, { status: 502 });
  }

  let data: unknown = {};
  try {
    data = text ? JSON.parse(text) : {};
  } catch {
    data = { message: text };
  }

  return NextResponse.json(data, { status: backendResponse.status });
}

export async function POST(request: Request) {
  try {
    return await proxy(request);
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach password service.' },
      { status: 500 }
    );
  }
}
