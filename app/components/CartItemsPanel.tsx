'use client';

import { useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useShopActions } from './ShopActionsProvider';
import { useState } from 'react';

type ShopItem = {
  id?: string;
  productId?: string;
  product_id?: string;
  quantity?: number;
  line_total?: number;
  unit_price?: number;
  product?: {
    id?: string;
    name?: string;
    title?: string;
    price?: number;
    image_url?: string;
    category?: string; // Added category to product definition
    stock?: number;
  };
  title?: string;
  name?: string;
  price?: number;
};

const getItemName = (item: ShopItem) => item.product?.name || item.product?.title || item.title || item.name || 'Product item';

const getProductId = (item: ShopItem) => String(item.product?.id ?? item.productId ?? item.product_id ?? item.id ?? '');

const getCartItemId = (item: ShopItem) => String(item.id ?? getProductId(item));

const getItemImage = (item: ShopItem) => item.product?.image_url || '/images/banner.jpg';

const getUnitPrice = (item: ShopItem) => Number(item.unit_price ?? item.product?.price ?? item.price ?? 0);

const getLineTotal = (item: ShopItem) => {
  if (typeof item.line_total === 'number') return item.line_total;
  return getUnitPrice(item) * (item.quantity ?? 1);
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(amount);

export default function CartItemsPanel() {
  const router = useRouter();
  const { cartItems, cartCount, removeFromCart, updateCartQuantity } = useShopActions();
  const [pendingRemoveId, setPendingRemoveId] = useState('');
  const [pendingQtyId, setPendingQtyId] = useState('');
  const [error, setError] = useState('');
  const [stockByProductId, setStockByProductId] = useState<Record<string, number>>({});

  const rows = useMemo(
    () =>
      cartItems.map((rawItem, index) => {
        const item = rawItem as ShopItem;
        return {
          key: String(getProductId(item) || `${getItemName(item)}-${index}`),
          cartItemId: getCartItemId(item),
          productId: getProductId(item),
          name: getItemName(item),
          image: getItemImage(item),
          category: item.product?.category || 'Selected product',
          quantity: item.quantity ?? 1,
          unitPrice: getUnitPrice(item),
          lineTotal: getLineTotal(item),
          stock: Number(item.product?.stock ?? stockByProductId[getProductId(item)] ?? 9999),
        };
      }),
    [cartItems, stockByProductId]
  );

  useEffect(() => {
    let cancelled = false;

    const loadStocks = async () => {
      const productIds = Array.from(new Set(rows.map((row) => row.productId).filter(Boolean)));
      if (!productIds.length) {
        setStockByProductId({});
        return;
      }

      const entries = await Promise.all(
        productIds.map(async (id) => {
          try {
            const response = await fetch(`/api/products/${encodeURIComponent(id)}`, {
              method: 'GET',
              credentials: 'include',
              cache: 'no-store',
            });
            if (!response.ok) return [id, 9999] as const;
            const data = (await response.json()) as { stock?: number };
            return [id, Number(data.stock ?? 9999)] as const;
          } catch {
            return [id, 9999] as const;
          }
        })
      );

      if (cancelled) return;
      setStockByProductId(Object.fromEntries(entries));
    };

    loadStocks();

    return () => {
      cancelled = true;
    };
  }, [rows.map((row) => row.productId).join('|')]);

  const subtotal = useMemo(() => rows.reduce((sum, row) => sum + row.lineTotal, 0), [rows]);
  const fees = rows.length ? 0 : 0;
  const totalAmount = subtotal + fees;

  const handleRemove = async (cartItemId: string, productId: string) => {
    setError('');
    setPendingRemoveId(cartItemId);
    try {
      await removeFromCart(cartItemId, productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove item.');
    } finally {
      setPendingRemoveId('');
    }
  };

  const handleQtyChange = async (cartItemId: string, productId: string, nextQty: number, maxStock: number) => {
    if (nextQty < 1) return;
    if (nextQty > maxStock) {
      setError(`Only ${maxStock} item(s) available in stock.`);
      return;
    }

    setError('');
    setPendingQtyId(cartItemId);
    try {
      await updateCartQuantity(cartItemId, nextQty, productId);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update quantity.');
    } finally {
      setPendingQtyId('');
    }
  };

  return (
    <section className="cart-page-shell">
      <div className="cart-page-layout">
        <div className="cart-items-column">
          <div className="cart-tab-head">
            <strong>Divine Products ({cartCount})</strong>
          </div>

          {error ? <p className="cart-page-error">{error}</p> : null}

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
                        <strong>{formatCurrency(row.lineTotal)}</strong>
                        {row.quantity > 1 ? <span>{row.quantity} × {formatCurrency(row.unitPrice)}</span> : null}
                      </div>
                    </div>
                  </div>

                  <div className="cart-item-footer">
                    <div className="cart-qty-control">
                      <button
                        className="cart-qty-btn"
                        type="button"
                        onClick={() => handleQtyChange(row.cartItemId, row.productId, row.quantity - 1, row.stock)}
                        disabled={pendingQtyId === row.cartItemId || row.quantity <= 1}
                        aria-label="Decrease quantity"
                      >
                        −
                      </button>
                      <span>Qty: {row.quantity}</span>
                      <button
                        className="cart-qty-btn"
                        type="button"
                        onClick={() => handleQtyChange(row.cartItemId, row.productId, row.quantity + 1, row.stock)}
                        disabled={pendingQtyId === row.cartItemId || row.quantity >= row.stock}
                        aria-label="Increase quantity"
                      >
                        +
                      </button>
                    </div>
                    <button
                      className="cart-remove-btn"
                      type="button"
                      onClick={() => handleRemove(row.cartItemId, row.productId)}
                      disabled={pendingRemoveId === row.cartItemId || pendingQtyId === row.cartItemId}
                    >
                      {pendingRemoveId === row.cartItemId ? 'Removing…' : 'Remove'}
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="cart-empty-state">Your cart is empty.</div>
          )}
        </div>

        <aside className="cart-summary-column">
          <div className="cart-summary-card">
            <h2>Price Details</h2>

            <div className="cart-summary-row">
              <span>MRP (incl. of all taxes)</span>
              <strong>{formatCurrency(subtotal)}</strong>
            </div>
            <div className="cart-summary-row">
              <span>Delivery Fees</span>
              <strong>{formatCurrency(fees)}</strong>
            </div>
            <div className="cart-summary-row total">
              <span>Total Amount</span>
              <strong>{formatCurrency(totalAmount)}</strong>
            </div>

          </div>

          <div className="cart-place-order">
            <div>
              <p>{formatCurrency(totalAmount)}</p>
              <small>Secure checkout</small>
            </div>
            <button type="button" disabled={!rows.length} onClick={() => router.push('/checkout')}>Place order</button>
          </div>
        </aside>
      </div>
    </section>
  );
}
