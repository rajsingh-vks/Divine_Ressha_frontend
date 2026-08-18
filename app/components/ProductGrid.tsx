'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import ProductCardActions from './ProductCardActions';
import type { Product } from '@/lib/data/products';
import { getProductReviews, type ProductReviewsResponse } from '@/lib/services/reviewService';
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

const renderStars = (rating: number) => {
  const filledStars = Math.round(rating);
  return `${'★'.repeat(Math.max(1, filledStars))}${'☆'.repeat(Math.max(0, 5 - filledStars))}`;
};

export default function ProductGrid({ products, variant = 'catalog' }: ProductGridProps) {
  const isHome = variant === 'home';
  const [reviewMap, setReviewMap] = useState<Map<string, ProductReviewsResponse | null>>(new Map());

  useEffect(() => {
    let isMounted = true;

    const loadReviews = async () => {
      const summaries = await Promise.all(
        products.map(async (product) => {
          try {
            const data = await getProductReviews(product.id);
            return [product.id, data] as const;
          } catch {
            return [product.id, null] as const;
          }
        })
      );

      if (isMounted) {
        setReviewMap(new Map(summaries));
      }
    };

    void loadReviews();

    return () => {
      isMounted = false;
    };
  }, [products]);

  return (
    <section className={isHome ? 'product-grid product-grid-home' : 'product-grid'} id="shop">
      {products.map((product) => {
        const discountedPrice = getDiscountedPrice(product.price);
        const reviewData = reviewMap.get(product.id);
        const averageRating = reviewData ? Number(reviewData.averageRating || 0) : 0;
        const reviewCount = reviewData ? Number(reviewData.total || 0) : 0;
        const showRating = reviewCount > 0 && averageRating > 0;

        return (
          <article className={isHome ? 'product-card product-card-home' : 'product-card'} key={product.id}>
            <div className="product-card-badge">Bestseller</div>
            <ProductCardActions product={product} />
            <Link href={`/products/${encodeURIComponent(product.id)}`} className="product-image-link" aria-label={`View ${product.title}`}>
              <div className="product-image">
                <img src={product.image} alt={product.title} loading="lazy" />
                {showRating ? (
                  <div className="product-image-rating" aria-label={`${averageRating.toFixed(1)} out of 5 stars based on ${reviewCount} reviews`}>
                    <span className="product-image-rating-stars">{renderStars(averageRating)}</span>
                    <strong>{averageRating.toFixed(1)}</strong>
                    <span>({reviewCount})</span>
                  </div>
                ) : null}
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
