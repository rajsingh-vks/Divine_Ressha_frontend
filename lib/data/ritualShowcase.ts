import { BACKEND_API_URL } from '@/lib/constants/auth';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type BackendRitualItem = {
  id?: string;
  _id?: string;
  item_id?: string;
  title?: string;
  subtitle?: string;
  description?: string;
  image_url?: string;
  image?: string;
  is_active?: boolean;
  display_order?: number;
  created_at?: string;
  updated_at?: string;
};

type RitualCollectionPayload =
  | BackendRitualItem[]
  | {
      items?: BackendRitualItem[];
      data?: BackendRitualItem[];
      ritual_showcase?: BackendRitualItem[];
      ritualShowcase?: BackendRitualItem[];
    };

export type RitualShowcaseItem = {
  id: string;
  title: string;
  subtitle: string;
  description: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

const READ_PATHS = [
  '/api/ritual-showcase',
  '/ritual-showcase',
  '/api/admin/ritual-showcase',
  '/admin/ritual-showcase',
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
      process.env.BACKEND_RITUAL_SHOWCASE_API_URL,
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

const normalizeList = (payload: RitualCollectionPayload): BackendRitualItem[] => {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || payload.ritual_showcase || payload.ritualShowcase || [];
};

const toStringOrEmpty = (value: unknown) => (typeof value === 'string' ? value : '');
const toNumberOrZero = (value: unknown, fallback = 0) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : fallback;
  }
  return fallback;
};

const mapItem = (raw: BackendRitualItem, index: number): RitualShowcaseItem | null => {
  const id = String(raw.id || raw._id || raw.item_id || '').trim();
  if (!id) return null;

  const title = toStringOrEmpty(raw.title).trim();
  const subtitle = toStringOrEmpty(raw.subtitle).trim();
  const description = toStringOrEmpty(raw.description).trim();
  const image_url = toStringOrEmpty(raw.image_url || raw.image).trim();

  if (!title || !subtitle || !image_url) return null;

  return {
    id,
    title,
    subtitle,
    description,
    image_url,
    is_active: Boolean(raw.is_active),
    display_order: toNumberOrZero(raw.display_order, index),
    created_at: raw.created_at,
    updated_at: raw.updated_at,
  };
};

const fetchCollection = async () => {
  let backendResponse: Response | null = null;

  for (const baseUrl of BACKEND_BASE_URLS) {
    for (const path of READ_PATHS) {
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

export async function getRitualShowcaseItems(): Promise<RitualShowcaseItem[]> {
  try {
    const response = await fetchCollection();

    if (!response || !response.ok) return [];

    const payload = (await response.json()) as RitualCollectionPayload;
    const list = normalizeList(payload);

    return list
      .map((item, index) => mapItem(item, index))
      .filter((item): item is RitualShowcaseItem => Boolean(item))
      .sort((a, b) => a.display_order - b.display_order)
      .map((item) => ({
        ...item,
        image_url: proxyImageUrl(item.image_url),
      }));
  } catch {
    return [];
  }
}
