'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';
import AdminSidebar from '@/app/components/AdminSidebar';

type AdminUser = {
  id?: string;
  email?: string;
  name?: string;
  role?: string;
};

type AdminFinancialBreakdown = {
  total_earned: number;
  total_refunded: number;
  net_revenue: number;
  total_orders: number;
  total_refund_orders: number;
  total_products: number;
  total_customers: number;
  currency: string;
};

const formatCurrencyByCode = (amount: number, currencyCode?: string) =>
  new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: (currencyCode || 'INR').toUpperCase(),
    maximumFractionDigits: 0,
  }).format(amount || 0);

const formatNumber = (value: number) => new Intl.NumberFormat('en-IN').format(value || 0);

export default function AdminDashboardPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [financialBreakdown, setFinancialBreakdown] = useState<AdminFinancialBreakdown | null>(null);
  const [financialLoading, setFinancialLoading] = useState(false);
  const [financialError, setFinancialError] = useState('');

  const getAuthHeaders = () => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const fetchFinancialBreakdown = async () => {
    setFinancialLoading(true);
    setFinancialError('');

    try {
      const endpoints = ['/api/orders/admin/financial-breakdown', '/api/orders/financial-breakdown'];
      let payload: Partial<AdminFinancialBreakdown> | null = null;
      let lastErrorMessage = 'Unable to fetch financial breakdown.';

      for (const endpoint of endpoints) {
        const response = await fetch(endpoint, {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (response.ok) {
          payload = (await response.json()) as Partial<AdminFinancialBreakdown>;
          break;
        }

        try {
          const errorPayload = (await response.json()) as { detail?: string; message?: string; error?: string };
          lastErrorMessage = errorPayload.detail || errorPayload.message || errorPayload.error || lastErrorMessage;
        } catch {
          // ignore parse errors, keep previous message
        }

        if (response.status !== 404) {
          break;
        }
      }

      if (!payload) {
        throw new Error(lastErrorMessage);
      }

      setFinancialBreakdown({
        total_earned: Number(payload.total_earned || 0),
        total_refunded: Number(payload.total_refunded || 0),
        net_revenue: Number(payload.net_revenue || 0),
        total_orders: Number(payload.total_orders || 0),
        total_refund_orders: Number(payload.total_refund_orders || 0),
        total_products: Number(payload.total_products || 0),
        total_customers: Number(payload.total_customers || 0),
        currency: String(payload.currency || 'INR'),
      });
    } catch (error) {
      setFinancialError(error instanceof Error ? error.message : 'Unable to fetch financial breakdown.');
      setFinancialBreakdown(null);
    } finally {
      setFinancialLoading(false);
    }
  };

  useEffect(() => {
    if (!ready) return;
    void fetchFinancialBreakdown();
  }, [ready]);

  useEffect(() => {
    const hasSession = localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
    const hasToken = Boolean(localStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
    const rawUser = localStorage.getItem(ADMIN_AUTH_USER_KEY);

    if (!hasSession && !hasToken) {
      router.replace('/admin/login');
      return;
    }

    if (!rawUser) {
      router.replace('/admin/login');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as AdminUser;
      if (parsed.role !== 'admin') {
        router.replace('/admin/login');
        return;
      }
      setAdminUser(parsed);
      setReady(true);
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  const displayName = useMemo(() => adminUser?.name || adminUser?.email || 'Admin', [adminUser]);

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    router.replace('/admin/login');
  };

  if (!ready) {
    return (
      <section className="admin-dashboard-shell">
        <div className="admin-dashboard-loading">
          <p>Loading admin dashboard...</p>
        </div>
      </section>
    );
  }

  const initials = (displayName || 'A')
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

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
              <input type="text" placeholder="Search products, orders, customers..." aria-label="Search" />
            </div>

            <div className="admin-user-pill">
              <span>{initials || 'AD'}</span>
              <div>
                <strong>{displayName}</strong>
                <small>Admin</small>
              </div>
            </div>
          </header>

          <section className="admin-hero">
            <p className="admin-overline">Welcome back</p>
            <h1>Good morning, {displayName.split(' ')[0] || 'Admin'}.</h1>
            <p>Here&apos;s what&apos;s happening across your store today — a quiet, elegant snapshot of your commerce.</p>
            <div className="admin-hero-actions">
              <button type="button" className="admin-primary-button" onClick={() => router.push('/admin/products')}>New product ↗</button>
              <button type="button" className="admin-ghost-button" onClick={handleLogout}>Logout</button>
            </div>
          </section>

          <section className="admin-stats-grid" aria-label="Store stats">
            <article className="admin-stat-card">
              <p>Total earned</p>
              <strong>
                {financialLoading
                  ? '…'
                  : formatCurrencyByCode(financialBreakdown?.total_earned || 0, financialBreakdown?.currency)}
              </strong>
              <span>{financialLoading ? 'Loading…' : `Net: ${formatCurrencyByCode(financialBreakdown?.net_revenue || 0, financialBreakdown?.currency)}`}</span>
            </article>
            <article className="admin-stat-card">
              <p>Orders</p>
              <strong>{financialLoading ? '…' : formatNumber(financialBreakdown?.total_orders || 0)}</strong>
              <span>{financialLoading ? 'Loading…' : `${formatNumber(financialBreakdown?.total_refund_orders || 0)} refund order(s)`}</span>
            </article>
            <article className="admin-stat-card">
              <p>Products</p>
              <strong>{financialLoading ? '…' : formatNumber(financialBreakdown?.total_products || 0)}</strong>
              <span>Across all orders</span>
            </article>
            <article className="admin-stat-card">
              <p>Customers</p>
              <strong>{financialLoading ? '…' : formatNumber(financialBreakdown?.total_customers || 0)}</strong>
              <span>Unique buyers</span>
            </article>
          </section>

          {financialError ? <p className="admin-products-error">{financialError}</p> : null}

          <section className="admin-summary-row">
            <div className="admin-summary-card">
              <h3>Topline</h3>
              <p>Role: <strong>{adminUser?.role}</strong></p>
              <p>Email: <strong>{adminUser?.email || 'Not available'}</strong></p>
            </div>
            <div className="admin-summary-card">
              <h3>Today</h3>
              <p>Total refunded: <strong>{formatCurrencyByCode(financialBreakdown?.total_refunded || 0, financialBreakdown?.currency)}</strong></p>
              <p>Net revenue: <strong>{formatCurrencyByCode(financialBreakdown?.net_revenue || 0, financialBreakdown?.currency)}</strong></p>
            </div>
          </section>
        </main>
        </div>
    </section>
  );
}
