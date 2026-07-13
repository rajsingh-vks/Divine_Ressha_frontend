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
  items: OrderItem[];
  shipping_address: ShippingAddress;
  total_items: number;
  subtotal: number;
  notes?: string | null;
  created_at: string;
  updated_at: string;
};

type FilterTab = 'All' | 'pending' | 'confirmed' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

const STATUS_OPTIONS = ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled'];

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (value: string) =>
  new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

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
                  <th>Status</th>
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
                      <td>{formatDate(order.created_at)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} className="admin-table-empty">
                      {loadingOrders ? 'Loading orders…' : 'No orders found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>
    </section>
  );
}
