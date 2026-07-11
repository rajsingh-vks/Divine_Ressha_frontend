'use client';

import type { Product } from '@/lib/data/products';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useShopActions } from './ShopActionsProvider';

export default function ProductCardActions({ product }: { product: Product }) {
  const { addToCart, toggleWishlist, isInCart, isWishlisted } = useShopActions();
  const [pending, setPending] = useState<'cart' | 'wishlist' | null>(null);
  const [error, setError] = useState('');
  const router = useRouter();

  const inCart = isInCart(product.id);
  const wishlisted = isWishlisted(product.id);

  const handleCart = async () => {
    try {
      setError('');
      setPending('cart');
      await addToCart(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to add to cart.';
      setError(message);
      if (message.toLowerCase().includes('login')) {
        router.push('/login');
      }
    } finally {
      setPending(null);
    }
  };

  const handleWishlist = async () => {
    try {
      setError('');
      setPending('wishlist');
      await toggleWishlist(product);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Unable to update wishlist.';
      setError(message);
      if (message.toLowerCase().includes('login')) {
        router.push('/login');
      }
    } finally {
      setPending(null);
    }
  };

  return (
    <div className="product-actions">
      <button
        className={`product-action-button icon-only wishlist-button ${wishlisted ? 'active' : ''} ${pending === 'wishlist' ? 'is-pending' : ''}`}
        type="button"
        onClick={handleWishlist}
        disabled={pending !== null}
        aria-label={wishlisted ? 'Remove from wishlist' : 'Add to wishlist'}
        title={wishlisted ? 'Wishlisted' : 'Wishlist'}
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill={wishlisted ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
        </svg>
      </button>
      <button
        className={`product-button icon-only cart-button ${inCart ? 'active' : ''} ${pending === 'cart' ? 'is-pending' : ''}`}
        type="button"
        onClick={handleCart}
        disabled={pending !== null}
        aria-label={inCart ? 'Added to cart' : `Add to cart - $${product.price}`}
        title={inCart ? 'Added to cart' : `Add to cart - $${product.price}`}
      >
        {inCart ? (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <circle cx="9" cy="21" r="1" />
            <circle cx="20" cy="21" r="1" />
            <path d="M1 1h4l2.68 12.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6" />
          </svg>
        )}
      </button>
      {error ? <p className="product-action-error">{error}</p> : null}
    </div>
  );
}
