'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY } from '@/lib/constants/auth';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

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
  payment_status?: string | null;
  items: OrderItem[];
  shipping_address: AddressSnapshot;
  total_items: number;
  subtotal: number;
  notes?: string | null;
  cancel_reason?: string | null;
  cancellation_reason?: string | null;
  cancelled_at?: string | null;
  return_status?: string | null;
  return_reason?: string | null;
  return_requested_at?: string | null;
  refund_status?: string | null;
  refund_amount?: number | null;
  refund_reason?: string | null;
  refund_reference?: string | null;
  refund_requested_at?: string | null;
  refunded_at?: string | null;
  status_history?: OrderStatusHistory[];
  created_at: string;
  updated_at: string;
};

type CancelModalState = {
  orderId: string;
  orderNumber: string;
  subtotal: number;
  paymentStatus?: string | null;
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
const prettyValue = (value?: string | null) => (value ? value.replace(/_/g, ' ') : '—');

export default function OrdersPanel() {
  const REFUND_REASONS = ['Wrong Product', 'Damaged Product', 'Product Missing', 'Duplicate Order', 'Other'] as const;
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [actionOrderId, setActionOrderId] = useState('');
  const [returnActionOrderId, setReturnActionOrderId] = useState('');
  const [cancelModal, setCancelModal] = useState<CancelModalState | null>(null);
  const [cancelReasonOption, setCancelReasonOption] = useState<(typeof REFUND_REASONS)[number]>('Wrong Product');
  const [cancelCommentsInput, setCancelCommentsInput] = useState('');
  const [cancelImages, setCancelImages] = useState<File[]>([]);
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

  const handleCancelOrder = async (orderId: string, reason: string) => {
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
      setCancelModal(null);
      setCancelReasonOption('Wrong Product');
      setCancelCommentsInput('');
      setCancelImages([]);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to cancel order.');
    } finally {
      setActionOrderId('');
    }
  };

  const openCancelModal = (order: Order) => {
    setCancelModal({
      orderId: order.id,
      orderNumber: order.order_number,
      subtotal: order.subtotal,
      paymentStatus: order.payment_status,
    });
    setCancelReasonOption('Wrong Product');
    setCancelCommentsInput('');
    setCancelImages([]);
  };

  const closeCancelModal = () => {
    if (actionOrderId) return;
    setCancelModal(null);
    setCancelReasonOption('Wrong Product');
    setCancelCommentsInput('');
    setCancelImages([]);
  };

  const handleReturnRequest = async (orderId: string) => {
    const reason = window.prompt('Reason for return (optional)') || '';
    setReturnActionOrderId(orderId);
    setError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/return`, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() || {}),
        },
        body: JSON.stringify({ reason: reason.trim() || null }),
      });

      if (!response.ok) {
        throw new Error(await getErrorMessage(response, 'Unable to request return.'));
      }

      await loadOrders();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to request return.');
    } finally {
      setReturnActionOrderId('');
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
            const returnable =
              order.status.toLowerCase() === 'delivered' && (order.return_status || '').toLowerCase() !== 'requested';
            const paymentStatus = (order.payment_status || 'unknown').toLowerCase();
            const cancellationReason = order.cancel_reason || order.cancellation_reason;
            const refundVisible =
              Boolean(order.refund_status) ||
              paymentStatus === 'paid' ||
              Boolean(order.refund_amount) ||
              Boolean(order.refund_requested_at) ||
              Boolean(order.refunded_at) ||
              order.status.toLowerCase() === 'cancelled';

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
                  <div>
                    <span>Payment</span>
                    <strong>{prettyValue(order.payment_status)}</strong>
                  </div>
                  <div>
                    <span>Return</span>
                    <strong>{prettyValue(order.return_status || 'not_requested')}</strong>
                  </div>
                  <div>
                    <span>Refund</span>
                    <strong>{prettyValue(order.refund_status || 'not_required')}</strong>
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
                      <img src={proxyImageUrl(item.image_url, '/images/banner.jpg')} alt={item.name} className="order-item-thumb" />
                      <div>
                        <strong>{item.name}</strong>
                        <small>Qty {item.quantity} × {formatCurrency(Number(item.unit_price || 0))}</small>
                      </div>
                      <span>{formatCurrency(Number(item.line_total || Number(item.unit_price || 0) * item.quantity))}</span>
                    </li>
                  ))}
                </ul>

                {order.notes ? <p className="order-note">Note: {order.notes}</p> : null}
                {cancellationReason ? <p className="order-note cancel">Cancel reason: {cancellationReason}</p> : null}

                {(order.return_status || order.return_reason || order.return_requested_at) ? (
                  <div className="order-status-history">
                    <h3>Return details</h3>
                    <ul>
                      <li>
                        <strong>Status</strong>
                        <span>{prettyValue(order.return_status || 'not_requested')}</span>
                        {order.return_requested_at ? <small>Requested on {formatDate(order.return_requested_at)}</small> : null}
                        {order.return_reason ? <small>Reason: {order.return_reason}</small> : null}
                      </li>
                    </ul>
                  </div>
                ) : null}

                {refundVisible ? (
                  <div className="order-status-history">
                    <h3>Refund flow</h3>
                    <ul>
                      <li>
                        <strong>Status</strong>
                        <span>{prettyValue(order.refund_status || (paymentStatus === 'paid' ? 'pending' : 'not_required'))}</span>
                        {order.refund_requested_at ? <small>Requested on {formatDate(order.refund_requested_at)}</small> : null}
                        {order.refunded_at ? <small>Processed on {formatDate(order.refunded_at)}</small> : null}
                      </li>
                      {order.refund_amount ? (
                        <li>
                          <strong>Amount</strong>
                          <span>{formatCurrency(Number(order.refund_amount || 0))}</span>
                        </li>
                      ) : null}
                      {order.refund_reason ? (
                        <li>
                          <strong>Reason</strong>
                          <span>{order.refund_reason}</span>
                        </li>
                      ) : null}
                      {order.refund_reference ? (
                        <li>
                          <strong>Reference</strong>
                          <span>{order.refund_reference}</span>
                        </li>
                      ) : null}
                    </ul>
                  </div>
                ) : null}

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
                    <button type="button" className="checkout-secondary-button" onClick={() => openCancelModal(order)} disabled={actionOrderId === order.id}>
                      {actionOrderId === order.id ? 'Cancelling…' : 'Cancel order'}
                    </button>
                  ) : null}
                  {returnable ? (
                    <button
                      type="button"
                      className="checkout-link-button"
                      onClick={() => handleReturnRequest(order.id)}
                      disabled={returnActionOrderId === order.id}
                    >
                      {returnActionOrderId === order.id ? 'Requesting return…' : 'Request return'}
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

      {cancelModal ? (
        <div className="orders-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="cancel-order-modal-title" onClick={closeCancelModal}>
          <div className="orders-modal" onClick={(event) => event.stopPropagation()}>
            <div className="orders-modal-header">
              <h2 id="cancel-order-modal-title">Cancel order</h2>
              <button
                type="button"
                className="orders-modal-close"
                onClick={closeCancelModal}
                aria-label="Close"
                disabled={Boolean(actionOrderId)}
              >
                ✕
              </button>
            </div>

            <div className="orders-modal-body">
              <p>
                You are cancelling <strong>{cancelModal.orderNumber}</strong>.
              </p>
              <p className="checkout-muted">
                Amount: {formatCurrency(cancelModal.subtotal)} · Payment: {prettyValue(cancelModal.paymentStatus || 'unknown')}
              </p>
              <p className="checkout-muted">
                If payment is marked as paid, a refund request will be created automatically.
              </p>

              <div>
                <p className="orders-modal-label">Reason</p>
                <div className="orders-modal-radio-grid" role="radiogroup" aria-label="Refund reason">
                  {REFUND_REASONS.map((reasonOption) => (
                    <label key={reasonOption} className="orders-modal-radio-option">
                      <input
                        type="radio"
                        name="refund-reason"
                        value={reasonOption}
                        checked={cancelReasonOption === reasonOption}
                        onChange={() => setCancelReasonOption(reasonOption)}
                        disabled={Boolean(actionOrderId)}
                      />
                      <span>{reasonOption}</span>
                    </label>
                  ))}
                </div>
              </div>

              <label className="orders-modal-label" htmlFor="cancel-comments-input">Comments</label>
              <textarea
                id="cancel-comments-input"
                className="orders-modal-textarea"
                rows={4}
                placeholder="Add details for refund request"
                value={cancelCommentsInput}
                onChange={(event) => setCancelCommentsInput(event.target.value)}
                maxLength={500}
                disabled={Boolean(actionOrderId)}
              />

              <div>
                <label className="orders-modal-label" htmlFor="cancel-images-input">Upload Images</label>
                <input
                  id="cancel-images-input"
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={(event) => setCancelImages(Array.from(event.target.files || []))}
                  disabled={Boolean(actionOrderId)}
                />
                {cancelImages.length ? (
                  <small className="checkout-muted">{cancelImages.length} file(s): {cancelImages.map((file) => file.name).join(', ')}</small>
                ) : null}
              </div>
            </div>

            <div className="orders-modal-actions">
              <button type="button" className="checkout-link-button" onClick={closeCancelModal} disabled={Boolean(actionOrderId)}>
                Keep order
              </button>
              <button
                type="button"
                className="checkout-secondary-button"
                onClick={() =>
                  handleCancelOrder(
                    cancelModal.orderId,
                    [
                      `Reason: ${cancelReasonOption}`,
                      cancelCommentsInput.trim() ? `Comments: ${cancelCommentsInput.trim()}` : null,
                      cancelImages.length ? `Images: ${cancelImages.map((file) => file.name).join(', ')}` : null,
                    ]
                      .filter(Boolean)
                      .join(' | ')
                  )
                }
                disabled={Boolean(actionOrderId)}
              >
                {actionOrderId ? 'Submitting…' : 'Submit Refund Request'}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
