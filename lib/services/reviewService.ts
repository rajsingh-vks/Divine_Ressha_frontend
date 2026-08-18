import { AUTH_TOKEN_KEY } from '@/lib/constants/auth';

export type Review = {
  id: string;
  review_id?: string;
  product_id?: string;
  productId?: string;
  order_id?: string;
  orderId?: string;
  rating: number;
  comment: string;
  review?: string;
  created_at?: string;
  updated_at?: string;
  product_name?: string;
  productName?: string;
  customer_name?: string;
  customerName?: string;
  name?: string;
  display_name?: string;
  product?: {
    id?: string;
    name?: string;
    title?: string;
    image_url?: string;
    image?: string;
  };
  user?: {
    id?: string;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
  customer?: {
    id?: string;
    name?: string;
    full_name?: string;
    first_name?: string;
    last_name?: string;
  };
  image_url?: string;
};

export type ProductReviewsResponse = {
  reviews: Review[];
  averageRating: number;
  total: number;
  breakdown: Record<number, number>;
};

const ensureNumber = (value: unknown, fallback = 0) => {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
};

const readToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem(AUTH_TOKEN_KEY) || '');
const getAuthHeaders = (): Record<string, string> => {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string | Array<{ msg?: string }>; message?: string; error?: string };
    const message = Array.isArray(payload.detail)
      ? payload.detail[0]?.msg || fallback
      : typeof payload.detail === 'string'
        ? payload.detail
        : payload.message || payload.error || fallback;

    if (message.includes('at least 12 characters') || message.includes('at least 12')) {
      return 'Review text can be 1 character or more.';
    }

    return message;
  } catch {
    return fallback;
  }
};

const safeArray = (value: unknown): unknown[] => {
  if (Array.isArray(value)) return value;
  return [];
};

const normalizeReview = (value: any): Review => {
  const product = value?.product || value?.product_details || value?.productInfo || {};
  const user = value?.user || value?.customer || value?.author || {};
  const reviewText = String(value?.comment ?? value?.review ?? value?.message ?? value?.text ?? '').trim();
  const productId = String(value?.product_id ?? value?.productId ?? value?.product?.id ?? value?.product_id ?? product?.id ?? '');
  const orderId = String(value?.order_id ?? value?.orderId ?? value?.order?.id ?? '');
  const rating = Math.max(1, Math.min(5, ensureNumber(value?.rating ?? value?.stars ?? value?.score, 0)));
  const displayName =
    [
      value?.customer_name,
      value?.customerName,
      value?.display_name,
      value?.name,
      user?.full_name,
      user?.name,
      user?.first_name && user?.last_name ? `${user.first_name} ${user.last_name}` : user?.first_name,
      product?.name,
      product?.title,
    ].find((entry) => typeof entry === 'string' && entry.trim()) || 'Customer';

  return {
    id: String(value?.id ?? value?.review_id ?? value?._id ?? ''),
    review_id: value?.review_id ?? value?.id ?? value?._id,
    product_id: productId || undefined,
    productId: productId || undefined,
    order_id: orderId || undefined,
    orderId: orderId || undefined,
    rating: Number.isFinite(rating) ? Math.min(5, Math.max(1, rating)) : 1,
    comment: reviewText,
    review: reviewText,
    created_at: value?.created_at ?? value?.createdAt,
    updated_at: value?.updated_at ?? value?.updatedAt,
    product_name: value?.product_name ?? value?.productName ?? product?.name ?? product?.title,
    productName: value?.product_name ?? value?.productName ?? product?.name ?? product?.title,
    customer_name: displayName,
    customerName: displayName,
    name: displayName,
    display_name: displayName,
    product: {
      id: String(product?.id ?? (productId || '')),
      name: product?.name || product?.title || value?.product_name || value?.productName,
      title: product?.title || product?.name || value?.product_name || value?.productName,
      image_url: product?.image_url || product?.image,
      image: product?.image || product?.image_url,
    },
    user,
    customer: user,
    image_url: value?.image_url ?? product?.image_url ?? product?.image,
  };
};

const normalizeReviewsPayload = (payload: unknown): Review[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload.map(normalizeReview);

  const record = payload as Record<string, any>;
  const candidates = [
    record.items,
    record.data,
    record.reviews,
    record.results,
    record.review,
    record.items && record.items.items,
    record.data && record.data.items,
  ];

  for (const candidate of candidates) {
    if (Array.isArray(candidate)) return candidate.map(normalizeReview);
  }

  return [];
};

const getBreakdown = (payload: Record<string, unknown>) => {
  const rawBreakdown = payload.breakdown || payload.rating_breakdown || payload.ratings || payload.star_breakdown || {};
  const result: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };

  if (rawBreakdown && typeof rawBreakdown === 'object') {
    Object.entries(rawBreakdown as Record<string, unknown>).forEach(([key, value]) => {
      const star = Number(key);
      if (Number.isFinite(star) && star >= 1 && star <= 5) {
        result[star] = ensureNumber(value, 0);
      }
    });
  }

  return result;
};

export async function getProductReviews(productId: string): Promise<ProductReviewsResponse> {
  const response = await fetch(`/api/products/${encodeURIComponent(productId)}/reviews`, {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to load product reviews.'));
  }

  const payload = (await response.json()) as Record<string, unknown>;
  const reviews = normalizeReviewsPayload(payload);
  const total = ensureNumber(payload.total ?? payload.count ?? payload.total_reviews ?? reviews.length, reviews.length);
  const averageRating =
    ensureNumber(
      payload.average_rating ?? payload.averageRating ?? payload.avg_rating ??
        (reviews.length ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length : 0),
      0
    );

  return {
    reviews,
    averageRating: Number(averageRating.toFixed(1)),
    total: total > 0 ? Math.max(total, reviews.length) : reviews.length,
    breakdown: getBreakdown(payload as Record<string, unknown>),
  };
}

export async function getMyReviews(): Promise<Review[]> {
  const response = await fetch('/api/reviews/me', {
    method: 'GET',
    credentials: 'include',
    headers: getAuthHeaders(),
    cache: 'no-store',
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to load your reviews.'));
  }

  const payload = (await response.json()) as Record<string, unknown>;
  return normalizeReviewsPayload(payload);
}

export async function createReview(payload: { product_id?: string; productId?: string; order_id?: string; orderId?: string; rating: number; comment?: string; review?: string }) {
  const token = readToken();
  if (!token) {
    throw new Error('Please log in to submit a review.');
  }

  const productId = String(payload.product_id ?? payload.productId ?? '').trim();
  const orderId = String(payload.order_id ?? payload.orderId ?? '').trim();
  const commentText = String(payload.comment ?? payload.review ?? '').trim();

  if (!productId || !orderId) {
    throw new Error('You can only review products you have purchased.');
  }

  const body = {
    product_id: productId,
    productId,
    order_id: orderId,
    orderId,
    rating: Number(payload.rating),
    comment: commentText,
    review: commentText,
  };

  const response = await fetch('/api/reviews', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to submit review.'));
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return normalizeReview(data);
}

export async function updateReview(reviewId: string, payload: { rating?: number; comment?: string; review?: string }) {
  const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'PUT',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(),
    },
    body: JSON.stringify({
      rating: payload.rating,
      comment: payload.comment ?? payload.review,
      review: payload.comment ?? payload.review,
    }),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to update review.'));
  }

  const data = (await response.json().catch(() => ({}))) as Record<string, unknown>;
  return normalizeReview(data);
}

export async function deleteReview(reviewId: string) {
  const response = await fetch(`/api/reviews/${encodeURIComponent(reviewId)}`, {
    method: 'DELETE',
    credentials: 'include',
    headers: getAuthHeaders(),
  });

  if (!response.ok) {
    throw new Error(await getErrorMessage(response, 'Unable to delete review.'));
  }

  return true;
}
