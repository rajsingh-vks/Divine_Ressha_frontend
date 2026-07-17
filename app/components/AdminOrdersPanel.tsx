'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';
import AdminSidebar from '@/app/components/AdminSidebar';

type AdminUser = { id?: string; email?: string; name?: string; role?: string };

type OrderItem = {
  product_id: string;
  name: string;
  quantity: number;
  unit_price?: number | null;
  line_total?: number | null;
};

type ShippingAddress = {
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
};

type Order = {
  id: string;
  order_number: string;
  user_id: string;
  status: string;
  payment_status?: string | null;
  return_status?: string | null;
  return_reason?: string | null;
  return_requested_at?: string | null;
  refund_status?: string | null;
  refund_amount?: number | null;
  refund_reason?: string | null;
  refund_reference?: string | null;
  refund_requested_at?: string | null;
  refunded_at?: string | null;
  items: OrderItem[];
  shipping_address: ShippingAddress;
  total_items: number;
  subtotal: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

type RefundSummary = {
  order_id: string;
  order_number: string;
  user_id: string;
  order_status?: string | null;
  payment_status?: string | null;
  return_status?: string | null;
  refund_status?: string | null;
  refund_amount?: number | null;
  refund_reason?: string | null;
  refund_reference?: string | null;
  refund_requested_at?: string | null;
  refunded_at?: string | null;
  updated_at?: string | null;
};

type FilterTab = 'All' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
const prettyValue = (value?: string | null) => (value ? value.replace(/_/g, ' ') : '—');

const getApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string; error?: string };
    return payload.detail || payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
};

export default function AdminOrdersPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loadingOrders, setLoadingOrders] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('All');
  const [updatingOrderId, setUpdatingOrderId] = useState('');
  const [updatingRefundOrderId, setUpdatingRefundOrderId] = useState('');
  const [requestingReturnOrderId, setRequestingReturnOrderId] = useState('');
  const [refundSummary, setRefundSummary] = useState<RefundSummary | null>(null);
  const [refundSummaryLoading, setRefundSummaryLoading] = useState(false);
  const [refundSummaryError, setRefundSummaryError] = useState('');
  const [refundSummaryOrderId, setRefundSummaryOrderId] = useState('');
  const [refundModalOpen, setRefundModalOpen] = useState(false);
  const [refundModalOrder, setRefundModalOrder] = useState<Order | null>(null);
  const [refundFormStatus, setRefundFormStatus] = useState('pending');
  const [refundFormReason, setRefundFormReason] = useState('');
  const [refundFormReference, setRefundFormReference] = useState('');
  const [refundFormError, setRefundFormError] = useState('');
  const [refundFormSuccess, setRefundFormSuccess] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const fetchOrders = async () => {
    setLoadingOrders(true);
    setFetchError('');

    try {
      const response = await fetch('/api/orders?limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to fetch orders.'));
      }

      const payload = (await response.json()) as Order[];
      setOrders(Array.isArray(payload) ? payload : []);
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to fetch orders.');
    } finally {
      setLoadingOrders(false);
    }
  };

  useEffect(() => {
    const hasSession = localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
    const hasToken = Boolean(localStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
    const rawUser = localStorage.getItem(ADMIN_AUTH_USER_KEY);
    if (!hasSession && !hasToken) { router.replace('/admin/login'); return; }
    if (!rawUser) { router.replace('/admin/login'); return; }
    try {
      const parsed = JSON.parse(rawUser) as AdminUser;
      if (parsed.role !== 'admin') { router.replace('/admin/login'); return; }
      setAdminUser(parsed);
      setReady(true);
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    void fetchOrders();
  }, [ready]);

  const displayName = adminUser?.name || adminUser?.email || 'Admin';
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map((part) => part[0]?.toUpperCase()).join('');

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    router.replace('/admin/login');
  };

  const filteredOrders = useMemo(
    () =>
      orders.filter((order) => {
        const query = search.trim().toLowerCase();
        const matchesSearch =
          !query ||
          order.order_number.toLowerCase().includes(query) ||
          order.user_id.toLowerCase().includes(query) ||
          order.shipping_address.full_name.toLowerCase().includes(query);
        const matchesFilter = filter === 'All' || order.status.toLowerCase() === filter;
        return matchesSearch && matchesFilter;
      }),
    [orders, search, filter]
  );

  const handleStatusChange = async (orderId: string, status: string) => {
    setUpdatingOrderId(orderId);
    setFetchError('');

    try {
      const response = await fetch(`/api/orders/${orderId}/status`, {
        method: 'PATCH',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() || {}),
        },
        body: JSON.stringify({ status }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to update order status.'));
      }

      await fetchOrders();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to update order status.');
    } finally {
      setUpdatingOrderId('');
    }
  };

  const handleReturnRequest = async (orderId: string) => {
    const reason = window.prompt('Reason for return request (optional)') || '';
    setRequestingReturnOrderId(orderId);
    setFetchError('');

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
        throw new Error(await getApiErrorMessage(response, 'Unable to request return.'));
      }

      await fetchOrders();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to request return.');
    } finally {
      setRequestingReturnOrderId('');
    }
  };

  const openRefundModal = async (order: Order) => {
    setRefundModalOrder(order);
    setRefundModalOpen(true);
    setRefundFormStatus((order.refund_status || 'pending').toLowerCase());
    setRefundFormReason(order.refund_reason || '');
    setRefundFormReference(order.refund_reference || '');
    setRefundFormError('');
    setRefundFormSuccess('');
    setRefundSummary(null);
    setRefundSummaryLoading(true);
    setRefundSummaryError('');
    setRefundSummaryOrderId(order.id);

    try {
      const response = await fetch(`/api/orders/${order.id}/refund`, {
        method: 'GET',
        credentials: 'include',
        headers: { ...(getAuthHeaders() || {}) },
        cache: 'no-store',
      });

      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to load refund data.'));

      const payload = (await response.json()) as RefundSummary;
      setRefundSummary(payload);
      setRefundFormStatus((payload.refund_status || 'pending').toLowerCase());
      setRefundFormReason(payload.refund_reason || '');
      setRefundFormReference(payload.refund_reference || '');
    } catch (error) {
      setRefundSummaryError(error instanceof Error ? error.message : 'Unable to load refund data.');
    } finally {
      setRefundSummaryLoading(false);
    }
  };

  const closeRefundModal = () => {
    if (updatingRefundOrderId) return;
    setRefundModalOpen(false);
    setRefundModalOrder(null);
    setRefundSummary(null);
    setRefundSummaryError('');
    setRefundSummaryOrderId('');
    setRefundFormError('');
    setRefundFormSuccess('');
  };

  const handleRefundFormSubmit = async () => {
    if (!refundModalOrder) return;
    if (!['pending', 'processed', 'rejected'].includes(refundFormStatus)) {
      setRefundFormError('Status must be pending, processed, or rejected.');
      return;
    }
    setUpdatingRefundOrderId(refundModalOrder.id);
    setRefundFormError('');
    setRefundFormSuccess('');

    try {
      const response = await fetch(`/api/orders/${refundModalOrder.id}/refund`, {
        method: 'PATCH',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() || {}) },
        body: JSON.stringify({
          status: refundFormStatus,
          refund_status: refundFormStatus,
          reason: refundFormReason.trim() || null,
          refund_reason: refundFormReason.trim() || null,
          refund_reference: refundFormReference.trim() || null,
        }),
      });

      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to update refund.'));

      setRefundFormSuccess('Refund updated successfully.');
      await fetchOrders();

      // Reload summary after update
      const refreshed = await fetch(`/api/orders/${refundModalOrder.id}/refund`, {
        method: 'GET',
        credentials: 'include',
        headers: { ...(getAuthHeaders() || {}) },
        cache: 'no-store',
      });
      if (refreshed.ok) setRefundSummary((await refreshed.json()) as RefundSummary);
    } catch (error) {
      setRefundFormError(error instanceof Error ? error.message : 'Unable to update refund.');
    } finally {
      setUpdatingRefundOrderId('');
    }
  };

  if (!ready) {
    return (
      <section className="admin-dashboard-shell">
        <div className="admin-dashboard-loading"><p>Loading…</p></div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard-shell">
      <div className="admin-dashboard-layout">
        <AdminSidebar displayName={displayName} initials={initials} onLogout={handleLogout} />

        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-search-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search order number, customer, user id..." aria-label="Search orders" />
            </div>

            <div className="admin-user-pill">
              <span>{initials || 'AD'}</span>
              <div><strong>{displayName}</strong><small>Admin</small></div>
            </div>
          </header>

          <div className="admin-page-heading">
            <div>
              <p className="admin-overline">Operations</p>
              <h1 className="admin-page-title">Orders</h1>
            </div>
            <div className="admin-orders-kpi">
              <strong>{orders.length}</strong>
              <span>Total orders</span>
            </div>
          </div>

          {fetchError ? <p className="admin-products-error">{fetchError}</p> : null}

          <div className="admin-product-toolbar">
            <div className="admin-filter-tabs">
              {(['All', 'pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'] as const).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`admin-filter-tab${filter === tab ? ' active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Items</th>
                  <th>Total</th>
                  <th>Address</th>
                  <th>Payment</th>
                  <th>Status</th>
                  <th>Return</th>
                  <th>Refund</th>
                  <th>Actions</th>
                  <th>Placed</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length ? (
                  filteredOrders.map((order) => (
                    <tr key={order.id}>
                      <td>
                        <div className="admin-order-cell">
                          <strong>{order.order_number}</strong>
                          <small>{order.user_id}</small>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-cell">
                          <strong>{order.shipping_address.full_name}</strong>
                          <small>{order.shipping_address.phone}</small>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-items-preview">
                          <strong>{order.total_items} item(s)</strong>
                          <small>{order.items.map((item) => `${item.name} × ${item.quantity}`).join(', ')}</small>
                        </div>
                      </td>
                      <td>{formatCurrency(order.subtotal)}</td>
                      <td>
                        <div className="admin-order-address">
                          <strong>{order.shipping_address.city}</strong>
                          <small>{order.shipping_address.line1}, {order.shipping_address.state}</small>
                        </div>
                      </td>
                      <td>{prettyValue(order.payment_status || 'unknown')}</td>
                      <td>
                        <div className="admin-order-status-wrap">
                          <span className={`admin-status-badge admin-order-status-badge ${order.status.toLowerCase()}`}>{order.status}</span>
                          <select
                            value={order.status.toLowerCase()}
                            onChange={(event) => handleStatusChange(order.id, event.target.value)}
                            disabled={updatingOrderId === order.id}
                          >
                            {STATUS_OPTIONS.map((status) => (
                              <option key={status} value={status}>{status}</option>
                            ))}
                          </select>
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-cell">
                          {order.status.toLowerCase() === 'cancelled' && !order.return_status ? (
                            <strong style={{ color: '#9b9185' }}>N/A</strong>
                          ) : (
                            <>
                              <strong>{prettyValue(order.return_status || 'not_requested')}</strong>
                              <small>{order.return_reason || '—'}</small>
                              {order.return_requested_at ? <small>{formatDate(order.return_requested_at)}</small> : null}
                            </>
                          )}
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-cell">
                          <strong>{prettyValue(order.refund_status || 'not_required')}</strong>
                          <small>
                            {order.refund_amount
                              ? `${formatCurrency(Number(order.refund_amount || 0))}${order.refund_reference ? ` · ${order.refund_reference}` : ''}`
                              : order.refund_reference || '—'}
                          </small>
                          {order.refund_requested_at ? <small>Req: {formatDate(order.refund_requested_at)}</small> : null}
                          {order.refunded_at ? <small>Done: {formatDate(order.refunded_at)}</small> : null}
                        </div>
                      </td>
                      <td>
                        <div className="admin-order-status-wrap">
                          <button
                            type="button"
                            className="checkout-secondary-button"
                            onClick={() => openRefundModal(order)}
                            disabled={refundSummaryLoading && refundSummaryOrderId === order.id}
                          >
                            {refundSummaryLoading && refundSummaryOrderId === order.id ? 'Loading…' : 'Manage refund'}
                          </button>
                          {order.status.toLowerCase() === 'delivered' && (order.return_status || '').toLowerCase() !== 'requested' ? (
                            <button
                              type="button"
                              className="checkout-link-button"
                              onClick={() => handleReturnRequest(order.id)}
                              disabled={requestingReturnOrderId === order.id}
                            >
                              {requestingReturnOrderId === order.id ? 'Requesting…' : 'Request return'}
                            </button>
                          ) : null}
                          {order.status.toLowerCase() === 'cancelled' && !order.return_status ? (
                            <span style={{ fontSize: '0.8rem', color: '#9b9185' }}>Cancelled — no return</span>
                          ) : null}
                        </div>
                      </td>
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={11} className="admin-table-empty">
                      {loadingOrders ? 'Loading orders…' : 'No orders found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {refundModalOpen ? (
        <div className="admin-modal-overlay" role="dialog" aria-modal="true" aria-labelledby="refund-modal-title" onClick={closeRefundModal}>
          <div className="admin-modal" style={{ width: 'min(100%, 640px)' }} onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2 id="refund-modal-title">Manage Refund · {refundModalOrder?.order_number}</h2>
              <button type="button" className="admin-modal-close" onClick={closeRefundModal} aria-label="Close" disabled={Boolean(updatingRefundOrderId)}>✕</button>
            </div>

            <div className="admin-product-form">
              {/* Summary info */}
              {refundSummaryLoading ? <p className="checkout-muted">Loading refund data…</p> : null}
              {refundSummaryError ? <p className="admin-products-error">{refundSummaryError}</p> : null}

              {refundSummary ? (
                <div className="order-status-history" style={{ marginBottom: '0.5rem' }}>
                  <h3 style={{ fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.08em', color: '#7a7469', marginBottom: '0.5rem' }}>Current refund data</h3>
                  <ul style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.45rem' }}>
                    <li><strong>Order status</strong><span>{prettyValue(refundSummary.order_status)}</span></li>
                    <li><strong>Payment status</strong><span>{prettyValue(refundSummary.payment_status)}</span></li>
                    <li><strong>Return status</strong><span>{prettyValue(refundSummary.return_status)}</span></li>
                    <li><strong>Refund status</strong><span>{prettyValue(refundSummary.refund_status)}</span></li>
                    <li><strong>Refund amount</strong><span>{formatCurrency(Number(refundSummary.refund_amount || 0))}</span></li>
                    <li><strong>Reference</strong><span>{refundSummary.refund_reference || '—'}</span></li>
                    <li><strong>Requested at</strong><span>{refundSummary.refund_requested_at ? formatDate(refundSummary.refund_requested_at) : '—'}</span></li>
                    <li><strong>Refunded at</strong><span>{refundSummary.refunded_at ? formatDate(refundSummary.refunded_at) : '—'}</span></li>
                  </ul>
                </div>
              ) : null}

              {/* Update form */}
              {!refundSummaryLoading ? (
                <div className="admin-form-grid">
                  <label className="admin-form-field">
                    <span>Refund status</span>
                    <select
                      value={refundFormStatus}
                      onChange={(e) => setRefundFormStatus(e.target.value)}
                      disabled={Boolean(updatingRefundOrderId)}
                    >
                      <option value="pending">Pending</option>
                      <option value="processed">Processed</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </label>

                  <label className="admin-form-field">
                    <span>Refund reference</span>
                    <input
                      type="text"
                      placeholder="e.g. TXN123456 or NEFT ref"
                      value={refundFormReference}
                      onChange={(e) => setRefundFormReference(e.target.value)}
                      disabled={Boolean(updatingRefundOrderId)}
                    />
                  </label>

                  <label className="admin-form-field admin-form-full">
                    <span>Refund reason</span>
                    <input
                      type="text"
                      placeholder="Reason for this refund decision"
                      value={refundFormReason}
                      onChange={(e) => setRefundFormReason(e.target.value)}
                      disabled={Boolean(updatingRefundOrderId)}
                    />
                  </label>
                </div>
              ) : null}

              {refundFormError ? <p className="admin-products-error" style={{ margin: 0 }}>{refundFormError}</p> : null}
              {refundFormSuccess ? <p style={{ margin: 0, color: '#047857', fontSize: '0.9rem' }}>{refundFormSuccess}</p> : null}

              <div className="admin-modal-footer">
                <button type="button" className="admin-ghost-button" onClick={closeRefundModal} disabled={Boolean(updatingRefundOrderId)}>Close</button>
                <button
                  type="button"
                  className="admin-primary-button"
                  onClick={handleRefundFormSubmit}
                  disabled={Boolean(updatingRefundOrderId) || refundSummaryLoading}
                >
                  {updatingRefundOrderId ? 'Saving…' : 'Save refund'}
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </section>
  );
}
