import Link from 'next/link';
import ProductCardActions from './ProductCardActions';
import type { Product } from '@/lib/data/products';

interface ProductGridProps {
  products: Product[];
}

const DISCOUNT_PERCENT = 20;

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="product-grid" id="shop">
      {products.map((product) => {
        const discountedPrice = Math.round(product.price * (1 - DISCOUNT_PERCENT / 100));

        return (
          <article className="product-card" key={product.id}>
            <ProductCardActions product={product} />
            <Link href={`/products/${encodeURIComponent(product.id)}`} className="product-image-link" aria-label={`View ${product.title}`}>
              <div className="product-image">
                <img src={product.image} alt={product.title} loading="lazy" />
              </div>
            </Link>
            <div className="product-copy">
              <p className="product-title">
                <Link href={`/products/${encodeURIComponent(product.id)}`}>{product.title}</Link>
              </p>
              <p className="product-tag">{product.tag}</p>
              <p className="product-notes">{product.notes}</p>
              <p className="price-tag">
                <span className="price-current">{formatCurrency(discountedPrice)}</span>
                <span className="price-original">{formatCurrency(product.price)}</span>
                <span className="price-discount">{DISCOUNT_PERCENT}% OFF</span>
              </p>
              <Link href={`/products/${encodeURIComponent(product.id)}`} className="product-detail-link">
                View details
              </Link>
            </div>
          </article>
        );
      })}
    </section>
  );
}
