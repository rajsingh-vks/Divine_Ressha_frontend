'use client';

import { useMemo } from 'react';
import { useShopActions } from './ShopActionsProvider';

type ShopItem = {
  id?: string;
  productId?: string;
  product_id?: string;
  product?: {
    id?: string;
    name?: string;
    title?: string;
  };
  title?: string;
  name?: string;
};

const getItemName = (item: ShopItem) => item.product?.name || item.product?.title || item.title || item.name || 'Product item';

const getItemKey = (item: ShopItem, index: number) =>
  String(item.productId ?? item.product_id ?? item.product?.id ?? item.id ?? `${getItemName(item)}-${index}`);

export default function WishlistItemsPanel() {
  const { wishlistItems, wishlistCount } = useShopActions();

  const rows = useMemo(
    () =>
      wishlistItems.map((item, index) => ({
        key: getItemKey(item, index),
        name: getItemName(item),
      })),
    [wishlistItems]
  );

  return (
    <section className="shop-list-page">
      <div className="shop-list-card">
        <h1>My Wishlist</h1>
        <p>{wishlistCount} selected item(s)</p>

        {rows.length ? (
          <ul className="shop-items-list">
            {rows.map((row) => (
              <li key={row.key}>
                <span>{row.name}</span>
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
