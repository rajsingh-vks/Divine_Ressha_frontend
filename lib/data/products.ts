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
