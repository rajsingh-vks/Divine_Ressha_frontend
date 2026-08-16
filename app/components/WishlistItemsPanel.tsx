'use client';

import { useMemo, useState } from 'react';
import { useShopActions } from './ShopActionsProvider';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type ShopItem = {
  id?: string;
  productId?: string;
  product_id?: string;
  price?: number;
  unit_price?: number;
  quantity?: number;
  product?: {
    id?: string;
    name?: string;
    title?: string;
    price?: number;
    image_url?: string;
    category?: string;
    stock?: number;
  };
  title?: string;
  name?: string;
  image_url?: string;
  category?: string;
};

const getProductId = (item: ShopItem) => String(item.product?.id ?? item.productId ?? item.product_id ?? item.id ?? '');
const getItemName = (item: ShopItem) => item.product?.name || item.product?.title || item.title || item.name || 'Product item';
const getItemImage = (item: ShopItem) => proxyImageUrl(item.product?.image_url || item.image_url, '/images/banner_main.jpeg');
const getItemPrice = (item: ShopItem) => Number(item.product?.price ?? item.price ?? item.unit_price ?? 0);
const getItemCategory = (item: ShopItem) => item.product?.category || item.category || 'Selected product';
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const getItemKey = (item: ShopItem, index: number) =>
  String(item.productId ?? item.product_id ?? item.product?.id ?? item.id ?? `${getItemName(item)}-${index}`);

export default function WishlistItemsPanel() {
  const { wishlistItems, wishlistCount, addToCart, toggleWishlist } = useShopActions();
  const [pendingId, setPendingId] = useState('');

  const rows = useMemo(
    () =>
      wishlistItems.map((item, index) => ({
        key: getItemKey(item, index),
        productId: getProductId(item),
        name: getItemName(item),
        image: getItemImage(item),
        category: getItemCategory(item),
        price: getItemPrice(item),
      })),
    [wishlistItems]
  );

  const handleMoveToCart = async (row: { productId: string; name: string; price: number }) => {
    setPendingId(row.productId);
    try {
      await addToCart({
        id: row.productId,
        title: row.name,
        price: row.price,
      } as any);
      await toggleWishlist({
        id: row.productId,
        title: row.name,
        price: row.price,
      } as any);
    } finally {
      setPendingId('');
    }
  };

  const handleRemove = async (row: { productId: string; name: string; price: number }) => {
    setPendingId(row.productId);
    try {
      await toggleWishlist({
        id: row.productId,
        title: row.name,
        price: row.price,
      } as any);
    } finally {
      setPendingId('');
    }
  };

  return (
    <section className="shop-list-page">
      <div className="shop-list-card">
        <div className="cart-tab-head">
          <strong>My Wishlist ({wishlistCount})</strong>
        </div>

        {rows.length ? (
          <ul className="cart-items-list">
            {rows.map((row) => (
              <li key={row.key} className="cart-item-card">
                <div className="cart-item-main">
                  <img src={row.image} alt={row.name} className="cart-item-image" />

                  <div className="cart-item-info">
                    <h3>{row.name}</h3>
                    <p>{row.category}</p>
                    <div className="cart-item-price">
                      <strong>{formatCurrency(row.price)}</strong>
                    </div>
                  </div>
                </div>

                <div className="cart-item-footer">
                  <button
                    type="button"
                    className="cart-remove-btn"
                    onClick={() => handleRemove(row)}
                    disabled={pendingId === row.productId}
                  >
                    {pendingId === row.productId ? 'Removing…' : 'Remove from wishlist'}
                  </button>

                  <button
                    type="button"
                    className="wishlist-move-to-cart-btn"
                    onClick={() => handleMoveToCart(row)}
                    disabled={pendingId === row.productId}
                  >
                    {pendingId === row.productId ? 'Moving…' : 'Move to cart'}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <div className="shop-empty-state">Your wishlist is empty.</div>
        )}
      </div>
    </section>
  );
}
