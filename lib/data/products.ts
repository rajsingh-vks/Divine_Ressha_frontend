import { BACKEND_API_URL } from '@/lib/constants/auth';
import { proxyImageUrl } from '../utils/imageProxy';

export interface Product {
  id: string;
  title: string;
  tag: string;
  notes: string;
  image: string;
  price: number;
  images?: string[];
  description?: string;
}

export interface ProductDetail extends Product {
  category?: string;
  subcategory?: string;
  brand?: string;
  fragrance?: string;
  packSize?: string;
  form?: string;
  usage?: string;
  stock?: number;
  sku?: string;
  status?: string;
  createdAt?: string;
  updatedAt?: string;
}

export const products: Product[] = [
  {
    id: '01',
    title: 'NO. 01 — ROSE DAMASK',
    tag: 'Floral · Velvet · Warm',
    notes: 'Bulgarian rose, pink pepper, sandalwood',
    image: 'https://world-cart-bloom.lovable.app/assets/p-rose-BJLzE2i3.jpg',
    price: 38,
    description: 'Luxurious rose-infused body wash with warm spice notes',
  },
  {
    id: '02',
    title: 'NO. 02 — NEROLI GROVE',
    tag: 'Citrus · Bright · Green',
    notes: 'Neroli blossom, bergamot, vetiver',
    image: 'https://world-cart-bloom.lovable.app/assets/p-neroli-CewDFFHR.jpg',
    price: 38,
    description: 'Energizing citrus blend with fresh green notes',
  },
  {
    id: '03',
    title: 'NO. 03 — CEDAR SMOKE',
    tag: 'Woody · Smoky · Deep',
    notes: 'Atlas cedar, frankincense, birch tar',
    image: 'https://world-cart-bloom.lovable.app/assets/p-cedar-wkhw0uPJ.jpg',
    price: 38,
    description: 'Deep woody fragrance with smoky undertones',
  },
  {
    id: '04',
    title: 'NO. 04 — LAVENDER FIELD',
    tag: 'Herbal · Calm · Soft',
    notes: 'Provence lavender, chamomile, oat milk',
    image: 'https://world-cart-bloom.lovable.app/assets/p-lavender-Ifnohzjg.jpg',
    price: 38,
    description: 'Soothing lavender with calming herbal notes',
  },
];

type BackendProduct = {
  id: string;
  _id?: string;
  name: string;
  category?: string | null;
  subcategory?: string | null;
  brand?: string | null;
  fragrance?: string | null;
  pack_size?: string | null;
  form?: string | null;
  usage?: string | null;
  price?: number | null;
  stock?: number | null;
  sku?: string | null;
  status?: string | null;
  image_url?: string | null;
  images?: string[] | null;
  created_at?: string;
  updated_at?: string;
};

type ProductCollectionPayload =
  | BackendProduct[]
  | {
      items?: BackendProduct[];
      data?: BackendProduct[];
      products?: BackendProduct[];
    };

const normalizeBackendProducts = (payload: ProductCollectionPayload): BackendProduct[] => {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || payload.products || [];
};

const PRODUCT_COLLECTION_PATHS = ['/products', '/api/products'];

const fetchFromBackend = async (paths: string[]) => {
  let backendResponse: Response | null = null;

  for (const path of paths) {
    const response = await fetch(`${BACKEND_API_URL}${path}`, {
      method: 'GET',
      cache: 'no-store',
    });

    backendResponse = response;

    if (response.status !== 404 && response.status !== 405) {
      return response;
    }
  }

  return backendResponse;
};

const mapBackendProductToUi = (product: BackendProduct, index: number): ProductDetail => {
  const categoryPart = product.category || 'Signature';
  const subcategoryPart = product.subcategory || product.form || 'Collection';
  const tag = `${categoryPart} · ${subcategoryPart}`;

  const notesParts = [product.fragrance, product.pack_size, product.usage].filter(Boolean) as string[];
  const notes = notesParts.length ? notesParts.join(' · ') : 'Botanical blend';

  const primaryImage = proxyImageUrl(product.image_url, products[index % products.length]?.image || products[0].image);
  const galleryImages = Array.isArray(product.images)
    ? product.images.filter((image): image is string => typeof image === 'string' && Boolean(image.trim())).map((image) => proxyImageUrl(image))
    : [];

  return {
    id: String(product.id || product._id || index + 1),
    title: product.name || `Product ${index + 1}`,
    tag,
    notes,
    image: primaryImage,
    images: Array.from(new Set([primaryImage, ...galleryImages])),
    price: Number(product.price ?? 0),
    description: product.brand || undefined,
    category: product.category || undefined,
    subcategory: product.subcategory || undefined,
    brand: product.brand || undefined,
    fragrance: product.fragrance || undefined,
    packSize: product.pack_size || undefined,
    form: product.form || undefined,
    usage: product.usage || undefined,
    stock: typeof product.stock === 'number' ? product.stock : undefined,
    sku: product.sku || undefined,
    status: product.status || undefined,
    createdAt: product.created_at,
    updatedAt: product.updated_at,
  };
};

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetchFromBackend(PRODUCT_COLLECTION_PATHS);

    if (!response || !response.ok) return products;

    const payload = (await response.json()) as ProductCollectionPayload;
    const collection = normalizeBackendProducts(payload);

    if (!collection.length) return products;

    return collection.map(mapBackendProductToUi);
  } catch {
    return products;
  }
}

export async function getProductDetails(productId: string): Promise<ProductDetail | null> {
  const normalizedId = String(productId || '').trim();
  if (!normalizedId) return null;

  const fallbackStatic = products.find((item) => item.id === normalizedId);

  try {
    const itemResponse = await fetchFromBackend([
      `/products/${encodeURIComponent(normalizedId)}`,
      `/api/products/${encodeURIComponent(normalizedId)}`,
    ]);

    if (itemResponse && itemResponse.ok) {
      const payload = (await itemResponse.json()) as BackendProduct;
      return mapBackendProductToUi(payload, 0);
    }

    const listResponse = await fetchFromBackend(PRODUCT_COLLECTION_PATHS);
    if (listResponse && listResponse.ok) {
      const payload = (await listResponse.json()) as ProductCollectionPayload;
      const collection = normalizeBackendProducts(payload);
      const found = collection.find(
        (item) => String(item.id || item._id || '') === normalizedId
      );

      if (found) {
        return mapBackendProductToUi(found, 0);
      }
    }
  } catch {
    // fall through to static fallback
  }

  if (fallbackStatic) {
    return {
      ...fallbackStatic,
      category: 'Signature',
      status: 'Active',
    };
  }

  return null;
}
