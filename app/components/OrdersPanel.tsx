'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY } from '@/lib/constants/auth';

type OrderItem = {
  product_id: string;
  name: string;
  image_url?: string | null;
  unit_price?: number | null;
  quantity: number;
  line_total?: number | null;
};

type AddressSnapshot = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
};

type OrderStatusHistory = {
  status: string;
  note?: string | null;
  changed_at: string;
  changed_by?: string | null;
};

type Order = {
  id: string;
  order_number: string;
  status: string;
  items: OrderItem[];
  shipping_address: AddressSnapshot;
  total_items: number;
  subtotal: number;
  notes?: string | null;
  cancel_reason?: string | null;
  cancelled_at?: string | null;
  status_history?: OrderStatusHistory[];
  created_at: string;
  updated_at: string;
};

const readToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem(AUTH_TOKEN_KEY) || '');
const hasSession = () => typeof window !== 'undefined' && localStorage.getItem(AUTH_SESSION_KEY) === '1';
const isAuthenticated = () => Boolean(readToken()) || hasSession();
const getAuthHeaders = () => {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const getErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string; error?: string };
    return payload.detail || payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
};

const addressText = (address: AddressSnapshot) =>
  [address.line1, address.line2, `${address.city}, ${address.state} ${address.postal_code}`, address.country]
    .filter(Boolean)
    .join(', ');

const statusClassName = (status: string) => `order-status-pill ${status.toLowerCase().replace(/\s+/g, '-')}`;

export default function OrdersPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionOrderId, setActionOrderId] = useState('');
  const [placedNotice, setPlacedNotice] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const params = new URLSearchParams(window.location.search);
    const orderNumber = params.get('order');
    const status = params.get('status');
    if (!orderNumber) return;

    setPlacedNotice(`Order ${orderNumber} placed successfully${status ? ` · ${status}` : ''}.`);
  }, []);

  const loadOrders = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('/api/orders/user/history', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to load orders.'));
      }

      const payload = (await response.json()) as Order[];
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load orders.');
    } finally {
      setLoading(false);
      setReady(true);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    void loadOrders();
  }, [router]);

  const handleCancelOrder = async (orderId: string) => {
    const reason = window.prompt('Reason for cancellation (optional)') || '';
    setActionOrderId(orderId);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/cancel`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() || {}),
        },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to cancel order.'));
      }

      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setActionOrderId('');
    }
  };

  if (!ready) {
    return (
      <section className="orders-shell">
        <div className="orders-empty-card"><p>Loading your orders...</p></div>
      </section>
    );
  }

  return (
    <section className="orders-shell">
      <div className="orders-page-head">
        <div>
          <p className="checkout-overline">My orders</p>
          <h1>Track your placed orders</h1>
        </div>
      </div>

      {placedNotice ? <p className="checkout-message success">{placedNotice}</p> : null}
      {error ? <p className="checkout-message error">{error}</p> : null}

      {loading ? <p className="checkout-muted">Refreshing orders...</p> : null}

      {orders.length ? (
        <div className="orders-list-grid">
          {orders.map((order) => {
            const cancellable = !['cancelled', 'delivered'].includes(order.status.toLowerCase());
            return (
              <article key={order.id} className="order-card">
                <div className="order-card-head">
                  <div>
                    <strong>{order.order_number}</strong>
                    <p>Placed {formatDate(order.created_at)}</p>
                  </div>
                  <span className={statusClassName(order.status)}>{order.status}</span>
                </div>

                <div className="order-meta-grid">
                  <div>
                    <span>Items</span>
                    <strong>{order.total_items}</strong>
                  </div>
                  <div>
                    <span>Total</span>
                    <strong>{formatCurrency(order.subtotal)}</strong>
                  </div>
                  <div>
                    <span>Delivery</span>
                    <strong>{order.shipping_address.address_type}</strong>
                  </div>
                </div>

                <div className="order-shipping-box">
                  <h3>Shipping address</h3>
                  <p>{order.shipping_address.full_name}</p>
                  <small>{addressText(order.shipping_address)} · {order.shipping_address.phone}</small>
                </div>

                <ul className="order-items-list">
                  {order.items.map((item) => (
                    <li key={`${order.id}-${item.product_id}`} className="order-item-row">
                      <img src={item.image_url || '/images/banner.jpg'} alt={item.name} className="order-item-thumb" />
                      <div>
                        <strong>{item.name}</strong>
                        <small>Qty {item.quantity} × {formatCurrency(Number(item.unit_price || 0))}</small>
                      </div>
                      <span>{formatCurrency(Number(item.line_total || Number(item.unit_price || 0) * item.quantity))}</span>
                    </li>
                  ))}
                </ul>

                {order.notes ? <p className="order-note">Note: {order.notes}</p> : null}
                {order.cancel_reason ? <p className="order-note cancel">Cancel reason: {order.cancel_reason}</p> : null}

                {order.status_history?.length ? (
                  <div className="order-status-history">
                    <h3>Status timeline</h3>
                    <ul>
                      {order.status_history.map((entry, index) => (
                        <li key={`${order.id}-${entry.changed_at}-${index}`}>
                          <strong>{entry.status}</strong>
                          <span>{formatDate(entry.changed_at)}</span>
                          {entry.note ? <small>{entry.note}</small> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                ) : null}

                <div className="order-card-actions">
                  {cancellable ? (
                    <button type="button" className="checkout-secondary-button" onClick={() => handleCancelOrder(order.id)} disabled={actionOrderId === order.id}>
                      {actionOrderId === order.id ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      ) : (
        <div className="orders-empty-card">
          <h2>No orders yet</h2>
          <p>Your placed orders and live status will appear here.</p>
        </div>
      )}
    </section>
  );
}
