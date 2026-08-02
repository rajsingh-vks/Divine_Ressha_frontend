import { BACKEND_API_URL } from '@/lib/constants/auth';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type BackendHeroBanner = {
  id?: string;
  _id?: string;
  banner_id?: string;
  title?: string;
  subtitle?: string;
  image_url?: string;
  image?: string;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

type HeroBannerCollectionPayload =
  | BackendHeroBanner[]
  | {
      items?: BackendHeroBanner[];
      data?: BackendHeroBanner[];
      banners?: BackendHeroBanner[];
    };

export type HeroBanner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

const HERO_BANNER_READ_PATHS = [
  '/api/admin/hero-banners',
  '/admin/hero-banners',
  '/api/hero-banners',
  '/hero-banners',
];

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
      process.env.BACKEND_HERO_BANNERS_API_URL,
      BACKEND_API_URL,
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

const normalizeBanners = (payload: HeroBannerCollectionPayload): BackendHeroBanner[] => {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || payload.banners || [];
};

const mapBanner = (banner: BackendHeroBanner, index: number): HeroBanner | null => {
  const id = String(banner.id || banner._id || banner.banner_id || '').trim();
  if (!id) return null;

  const title = String(banner.title || '').trim();
  const subtitle = String(banner.subtitle || '').trim();
  const imageUrl = String(banner.image_url || banner.image || '').trim();

  if (!title || !subtitle || !imageUrl) return null;

  return {
    id,
    title,
    subtitle,
    image_url: imageUrl,
    is_active: Boolean(banner.is_active),
    display_order:
      typeof banner.display_order === 'number' && Number.isFinite(banner.display_order)
        ? banner.display_order
        : index,
    created_at: banner.created_at,
    updated_at: banner.updated_at,
  };
};

const fetchCollection = async () => {
  let backendResponse: Response | null = null;

  for (const baseUrl of BACKEND_BASE_URLS) {
    for (const path of HERO_BANNER_READ_PATHS) {
      try {
        const response = await fetch(`${baseUrl}${path}`, {
          method: 'GET',
          cache: 'no-store',
        });

        backendResponse = response;

        if (response.status !== 404 && response.status !== 405) {
          return response;
        }
      } catch {
        // try next candidate
      }
    }
  }

  return backendResponse;
};

export async function getHeroBanners(): Promise<HeroBanner[]> {
  try {
    const response = await fetchCollection();

    if (!response || !response.ok) return [];

    const payload = (await response.json()) as HeroBannerCollectionPayload;
    const records = normalizeBanners(payload);

    return records
      .map((item, index) => mapBanner(item, index))
      .filter((item): item is HeroBanner => Boolean(item))
      .sort((a, b) => a.display_order - b.display_order);
  } catch {
    return [];
  }
}

export async function getPrimaryHeroBanner() {
  const banners = await getHeroBanners();
  const active = banners.filter((banner) => banner.is_active);
  const selected = (active.length ? active : banners)[0] || null;

  if (!selected) return null;

  return {
    title: selected.title,
    subtitle: selected.subtitle,
    backgroundImage: proxyImageUrl(selected.image_url),
  };
}
