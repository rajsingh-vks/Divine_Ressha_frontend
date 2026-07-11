'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';

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
      <section className="auth-page">
        <div className="auth-card">
          <p>Loading admin dashboard...</p>
        </div>
      </section>
    );
  }

  return (
    <section className="auth-page">
      <div className="auth-card profile-card">
        <div className="auth-copy">
          <h1>Admin Dashboard</h1>
          <p>Welcome, {displayName}</p>
        </div>

        <div className="profile-summary">
          <div>
            <span>Role</span>
            <strong>{adminUser?.role}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{adminUser?.email || 'Not available'}</strong>
          </div>
        </div>

        <button className="auth-submit" type="button" onClick={handleLogout}>
          Logout
        </button>
      </div>
    </section>
  );
}
