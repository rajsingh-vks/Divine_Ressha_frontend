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
      <button className={`product-action-button ${wishlisted ? 'active' : ''}`} type="button" onClick={handleWishlist} disabled={pending !== null}>
        {pending === 'wishlist' ? 'Updating…' : wishlisted ? 'Wishlisted' : 'Wishlist'}
      </button>
      <button className={`product-button ${inCart ? 'active' : ''}`} type="button" onClick={handleCart} disabled={pending !== null}>
        {pending === 'cart' ? 'Adding…' : inCart ? 'Added to cart' : `Add — $${product.price}`}
      </button>
      {error ? <p className="product-action-error">{error}</p> : null}
    </div>
  );
}
