import Link from 'next/link';
import ProductCardActions from './ProductCardActions';
import type { Product } from '@/lib/data/products';
import { DISCOUNT_PERCENT, getDiscountedPrice } from '@/lib/utils/pricing';

interface ProductGridProps {
  products: Product[];
  variant?: 'home' | 'catalog';
}

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

export default function ProductGrid({ products, variant = 'catalog' }: ProductGridProps) {
  const isHome = variant === 'home';

  return (
    <section className={isHome ? 'product-grid product-grid-home' : 'product-grid'} id="shop">
      {products.map((product) => {
        const discountedPrice = getDiscountedPrice(product.price);

        return (
          <article className={isHome ? 'product-card product-card-home' : 'product-card'} key={product.id}>
            <div className="product-card-badge">Bestseller</div>
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
              <div className="product-price-row">
                <span className="price-current">{formatCurrency(discountedPrice)}</span>
                <span className="price-original">{formatCurrency(product.price)}</span>
                <span className="price-discount">{DISCOUNT_PERCENT}% off</span>
              </div>
            </div>
          </article>
        );
      })}
    </section>
  );
}
