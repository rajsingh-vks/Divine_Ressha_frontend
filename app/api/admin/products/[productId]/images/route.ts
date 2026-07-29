import { NextResponse } from 'next/server';
import { BACKEND_API_URL } from '@/lib/constants/auth';

const trimBase = (value?: string | null) => (value || '').trim().replace(/\/+$/, '');

const BACKEND_BASE_URLS = Array.from(
  new Set(
    [
      process.env.BACKEND_IMAGE_API_URL,
      BACKEND_API_URL,
      process.env.BACKEND_API_URL_FALLBACK,
      process.env.NEXT_PUBLIC_API_URL,
      'https://api.divineressha.com',
      'https://divineressha.com',
      'https://www.divineressha.com',
    ]
      .map((v) => trimBase(v))
      .filter(Boolean)
  )
);

const IMAGE_PATH_BUILDERS = [
  (productId: string) => `/api/admin/products/${encodeURIComponent(productId)}/images`,
  (productId: string) => `/admin/products/${encodeURIComponent(productId)}/images`,
  (productId: string) => `/api/products/${encodeURIComponent(productId)}/images`,
  (productId: string) => `/products/${encodeURIComponent(productId)}/images`,
];

const parseResponsePayload = async (response: Response) => {
  const text = await response.text();
  try {
    return text ? JSON.parse(text) : {};
  } catch {
    return { message: text };
  }
};

export async function POST(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const reqUrl = new URL(request.url);
  const requestOrigin = trimBase(reqUrl.origin);

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  // Do not forward content-type for multipart rebuilds.
  // fetch will set the correct boundary automatically for FormData.

  let requestFormData: FormData;
  try {
    requestFormData = await request.formData();
  } catch {
    return NextResponse.json({ detail: 'Invalid multipart form data.' }, { status: 400 });
  }

  const imageFiles = requestFormData
    .getAll('images')
    .filter((entry): entry is File => entry instanceof File && entry.size > 0);

  if (!imageFiles.length) {
    return NextResponse.json({ detail: 'At least one image is required.' }, { status: 400 });
  }

  const buildImagesFormData = () => {
    const formData = new FormData();
    imageFiles.forEach((file) => formData.append('images', file, file.name));
    return formData;
  };

  let backendResponse: Response | null = null;
  let payload: unknown = {};
  const attemptedUrls: string[] = [];
  const baseUrls = requestOrigin ? Array.from(new Set([requestOrigin, ...BACKEND_BASE_URLS])) : BACKEND_BASE_URLS;

  for (const baseUrl of baseUrls) {
    for (const buildPath of IMAGE_PATH_BUILDERS) {
      const targetUrl = `${baseUrl}${buildPath(productId)}`;
      attemptedUrls.push(targetUrl);

      const response = await fetch(targetUrl, {
        method: 'POST',
        headers,
        body: buildImagesFormData(),
        cache: 'no-store',
      });

      backendResponse = response;
      payload = await parseResponsePayload(response);

      if (response.status !== 404 && response.status !== 405) {
        break;
      }
    }

    if (backendResponse && backendResponse.status !== 404 && backendResponse.status !== 405) {
      break;
    }
  }

  if (!backendResponse) {
    return NextResponse.json({ detail: 'Unable to reach product image service.' }, { status: 502 });
  }

  if (backendResponse.status === 404) {
    return NextResponse.json(
      {
        detail: 'Product image endpoint not found on configured backend.',
        attempted: attemptedUrls,
      },
      { status: 502 }
    );
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}

export async function DELETE(request: Request, { params }: { params: Promise<{ productId: string }> }) {
  const { productId } = await params;
  const reqUrl = new URL(request.url);
  const requestOrigin = trimBase(reqUrl.origin);
  const imageUrl = reqUrl.searchParams.get('image_url');

  if (!imageUrl) {
    return NextResponse.json({ detail: 'image_url is required.' }, { status: 400 });
  }

  const headers = new Headers();
  const authHeader = request.headers.get('authorization');
  const cookieHeader = request.headers.get('cookie');

  if (authHeader) headers.set('authorization', authHeader);
  if (cookieHeader) headers.set('cookie', cookieHeader);
  headers.set('content-type', 'application/json');

  let backendResponse: Response | null = null;
  let payload: unknown = {};
  const attemptedUrls: string[] = [];
  const baseUrls = requestOrigin ? Array.from(new Set([requestOrigin, ...BACKEND_BASE_URLS])) : BACKEND_BASE_URLS;

  for (const baseUrl of baseUrls) {
    for (const buildPath of IMAGE_PATH_BUILDERS) {
      const endpoint = `${baseUrl}${buildPath(productId)}?image_url=${encodeURIComponent(imageUrl)}`;
      attemptedUrls.push(endpoint);
      const response = await fetch(endpoint, {
        method: 'DELETE',
        headers,
        body: JSON.stringify({ image_url: imageUrl }),
        cache: 'no-store',
      });

      backendResponse = response;
      payload = await parseResponsePayload(response);

      if (response.status !== 404 && response.status !== 405) {
        break;
      }
    }

    if (backendResponse && backendResponse.status !== 404 && backendResponse.status !== 405) {
      break;
    }
  }

  if (!backendResponse) {
    return NextResponse.json(
      { detail: 'Unable to reach product image service.' },
      { status: 502 }
    );
  }

  if (backendResponse.status === 404) {
    return NextResponse.json(
      {
        detail: 'Product image deletion endpoint not found on configured backend.',
        attempted: attemptedUrls,
      },
      { status: 502 }
    );
  }

  if (backendResponse.status === 405) {
    return NextResponse.json(
      { detail: 'Image deletion endpoint is not available on backend yet.' },
      { status: 501 }
    );
  }

  return NextResponse.json(payload, { status: backendResponse.status });
}
