import ProductCardActions from './ProductCardActions';
import type { Product } from '@/lib/data/products';

interface ProductGridProps {
  products: Product[];
}

export default function ProductGrid({ products }: ProductGridProps) {
  return (
    <section className="product-grid" id="shop">
      {products.map((product) => (
        <article className="product-card" key={product.title}>
          <ProductCardActions product={product} />
          <div className="product-image">
            <img src={product.image} alt={product.title} loading="lazy" />
          </div>
          <div className="product-copy">
            <p className="product-title">{product.title}</p>
            <p className="product-tag">{product.tag}</p>
            <p className="product-notes">{product.notes}</p>
            <p className="price-tag">${product.price}</p>
          </div>
        </article>
      ))}
    </section>
  );
}
