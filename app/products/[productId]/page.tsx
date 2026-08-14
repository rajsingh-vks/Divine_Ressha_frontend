import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProductCardActions from '../../components/ProductCardActions';
import ProductImageGallery from '../../components/ProductImageGallery';
import ProductGrid from '../../components/ProductGrid';
import { getProductDetails, getProducts } from '@/lib/data/products';
import { DISCOUNT_PERCENT, getDiscountedPrice } from '@/lib/utils/pricing';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value);

type ProductDetailsPageProps = {
  params: Promise<{ productId: string }>;
};

export async function generateMetadata({ params }: ProductDetailsPageProps): Promise<Metadata> {
  const { productId } = await params;
  const product = await getProductDetails(productId);

  if (!product) {
    return {
      title: 'Product Not Found | Divine Ressha',
    };
  }

  return {
    title: `${product.title} | Divine Ressha`,
    description: product.notes || product.description || 'Product details',
  };
}

export const dynamic = 'force-dynamic';

export default async function ProductDetailsPage({ params }: ProductDetailsPageProps) {
  const { productId } = await params;
  const product = await getProductDetails(productId);

  if (!product) {
    notFound();
  }

  const allProducts = await getProducts();
  const relatedProducts = allProducts.filter((item) => item.id !== product.id).slice(0, 4);
  const discountedPrice = getDiscountedPrice(product.price);

  return (
    <>
      <Header />

      <main className="product-detail-shell">
        <section className="product-detail-card">
          <div className="product-detail-media">
            <ProductImageGallery images={product.images?.length ? product.images : [product.image]} alt={product.title} />
          </div>

          <div className="product-detail-content">
            <p className="checkout-overline">Product details</p>
            <h1>{product.title}</h1>

            <p className="product-tag">{product.tag}</p>
            <p className="product-notes">{product.notes}</p>

            <div className="product-detail-price">
              <span className="price-current">{formatCurrency(discountedPrice)}</span>
              <span className="price-original">{formatCurrency(product.price)}</span>
              <span className="price-discount">{DISCOUNT_PERCENT}% OFF</span>
            </div>

            <div className="product-detail-actions">
              <ProductCardActions product={product} />
            </div>

            <div className="product-detail-meta">
              <p><strong>Category:</strong> {product.category || '—'}</p>
              <p><strong>Subcategory:</strong> {product.subcategory || '—'}</p>
              <p><strong>Brand:</strong> {product.brand || '—'}</p>
              <p><strong>Fragrance:</strong> {product.fragrance || '—'}</p>
              <p><strong>Pack Size:</strong> {product.packSize || '—'}</p>
              <p><strong>Form:</strong> {product.form || '—'}</p>
              <p><strong>Usage:</strong> {product.usage || '—'}</p>
              <p><strong>Stock:</strong> {typeof product.stock === 'number' ? product.stock : '—'}</p>
              <p><strong>SKU:</strong> {product.sku || '—'}</p>
              <p><strong>Status:</strong> {product.status || '—'}</p>
            </div>
          </div>
        </section>

        {relatedProducts.length > 0 ? (
          <section className="related-products">
            <div className="related-products-header">
              <h2>More products</h2>
            </div>
            <ProductGrid products={relatedProducts} variant="home" />
          </section>
        ) : null}
      </main>

      <Footer />
    </>
  );
}
