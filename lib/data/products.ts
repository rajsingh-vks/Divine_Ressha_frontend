import { BACKEND_API_URL } from '@/lib/constants/auth';
import { proxyImageUrl } from '../utils/imageProxy';

export interface Product {
  id: string;
  title: string;
  tag: string;
  notes: string;
  image: string;
  price: number;
  description?: string;
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

const mapBackendProductToUi = (product: BackendProduct, index: number): Product => {
  const categoryPart = product.category || 'Signature';
  const subcategoryPart = product.subcategory || product.form || 'Collection';
  const tag = `${categoryPart} · ${subcategoryPart}`;

  const notesParts = [product.fragrance, product.pack_size, product.usage].filter(Boolean) as string[];
  const notes = notesParts.length ? notesParts.join(' · ') : 'Botanical blend';

  return {
    id: String(product.id || index + 1),
    title: product.name || `Product ${index + 1}`,
    tag,
    notes,
    image: proxyImageUrl(product.image_url, products[index % products.length]?.image || products[0].image),
    price: Number(product.price ?? 0),
    description: product.brand || undefined,
  };
};

export async function getProducts(): Promise<Product[]> {
  try {
    const response = await fetch(`${BACKEND_API_URL}/products`, {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) return products;

    const payload = (await response.json()) as ProductCollectionPayload;
    const collection = normalizeBackendProducts(payload);

    if (!collection.length) return products;

    return collection.map(mapBackendProductToUi);
  } catch {
    return products;
  }
}
