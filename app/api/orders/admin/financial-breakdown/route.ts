import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const normalizeBase = (value?: string | null) => (value || '').trim().replace(/\/+$/, '');

const isAbsoluteHttpUrl = (value: string) => {
  try {
    const parsed = new URL(value);
    return parsed.protocol === 'http:' || parsed.protocol === 'https:';
  } catch {
    return false;
  }
};

const BACKEND_BASE_URLS = Array.from(
  new Set(
    [
      BACKEND_API_URL,
      process.env.BACKEND_API_URL,
      process.env.BACKEND_API_URL_FALLBACK,
      process.env.NEXT_PUBLIC_API_URL,
      'http://127.0.0.1:8000',
      'http://localhost:8000',
      'http://127.0.0.1:8001',
      'http://localhost:8001',
      'https://api.divineressha.com',
    ]
      .map((value) => normalizeBase(value))
      .filter((value) => value && isAbsoluteHttpUrl(value))
  )
);

const FINANCIAL_BREAKDOWN_PATHS = [
  '/orders/admin/financial-breakdown',
  '/api/orders/admin/financial-breakdown',
  '/orders/financial-breakdown',
  '/api/orders/financial-breakdown',
  '/orders/admin/financial_breakdown',
  '/api/orders/admin/financial_breakdown',
  '/orders/financial_breakdown',
  '/api/orders/financial_breakdown',
  '/admin/orders/financial-breakdown',
  '/api/admin/orders/financial-breakdown',
  '/admin/orders/financial_breakdown',
  '/api/admin/orders/financial_breakdown',
];

export async function GET(request: Request) {
  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);

  let backendResponse: Response | null = null;
  let text = '';
  let fallbackResponse: Response | null = null;
  let fallbackText = '';

  for (const baseUrl of BACKEND_BASE_URLS) {
    for (const path of FINANCIAL_BREAKDOWN_PATHS) {
      let response: Response;
      try {
        response = await fetch(`${baseUrl}${path}`, {
          method: 'GET',
          headers,
          cache: 'no-store',
        });
      } catch {
        continue;
      }

      const responseText = await response.text();

      if (response.ok) {
        backendResponse = response;
        text = responseText;
        break;
      }

      // Keep the latest fallback candidate and keep probing remaining path variants.
      // Some backends can return 400/422 on a partially matching route while another
      // alias path is the correct one.
      fallbackResponse = response;
      fallbackText = responseText;

      if (![400, 404, 405, 422].includes(response.status)) {
        backendResponse = response;
        text = responseText;
        break;
      }
    }

    if (backendResponse) {
      break;
    }
  }

  if (!backendResponse && fallbackResponse) {
    backendResponse = fallbackResponse;
    text = fallbackText;
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach financial breakdown service.' }, { status: 502 });
  }

  let payload: unknown = {};
  try {
    payload = text ? JSON.parse(text) : {};
  } catch {
    payload = { message: text };
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}
