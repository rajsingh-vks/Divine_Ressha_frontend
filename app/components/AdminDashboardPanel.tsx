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

export default function AdminDashboardPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);

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
              <p>Revenue</p>
              <strong>$48,290</strong>
              <span>+12.4% this week</span>
            </article>
            <article className="admin-stat-card">
              <p>Orders</p>
              <strong>1,284</strong>
              <span>+3.1% this week</span>
            </article>
            <article className="admin-stat-card">
              <p>Products</p>
              <strong>312</strong>
              <span>+8 this week</span>
            </article>
            <article className="admin-stat-card">
              <p>Customers</p>
              <strong>4,921</strong>
              <span>+64 this week</span>
            </article>
          </section>

          <section className="admin-summary-row">
            <div className="admin-summary-card">
              <h3>Topline</h3>
              <p>Role: <strong>{adminUser?.role}</strong></p>
              <p>Email: <strong>{adminUser?.email || 'Not available'}</strong></p>
            </div>
            <div className="admin-summary-card">
              <h3>Today</h3>
              <p>2 pending payouts</p>
              <p>9 orders to dispatch</p>
            </div>
          </section>
        </main>
        </div>
    </section>
  );
}
