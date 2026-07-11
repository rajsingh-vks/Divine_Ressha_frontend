'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';

type AdminLoginResponse = {
  token?: string;
  message?: string;
  detail?: string;
  user?: {
    id?: string;
    email?: string;
    name?: string;
    role?: string;
  };
};

export default function AdminLoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const isSession = localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
    const userRaw = localStorage.getItem(ADMIN_AUTH_USER_KEY);
    const hasToken = Boolean(localStorage.getItem(ADMIN_AUTH_TOKEN_KEY));

    if (!isSession && !hasToken) return;

    if (!userRaw) {
      router.replace('/admin/dashboard');
      return;
    }

    try {
      const parsed = JSON.parse(userRaw) as { role?: string };
      if (parsed.role === 'admin') {
        router.replace('/admin/dashboard');
      }
    } catch {
      router.replace('/admin/dashboard');
    }
  }, [router]);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setLoading(true);

    try {
      const response = await fetch('/api/admin/login', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, password }),
      });

      const data = (await response.json()) as AdminLoginResponse;

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Admin login failed.');
      }

      if (data.token) {
        localStorage.setItem(ADMIN_AUTH_TOKEN_KEY, data.token);
      } else {
        localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
      }

      localStorage.setItem(ADMIN_AUTH_SESSION_KEY, '1');
      localStorage.setItem(
        ADMIN_AUTH_USER_KEY,
        JSON.stringify({
          id: data.user?.id || '',
          email: data.user?.email || email,
          name: data.user?.name || '',
          role: data.user?.role || 'admin',
        })
      );

      router.replace('/admin/dashboard');
      router.refresh();
      window.location.assign('/admin/dashboard');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to login as admin.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-copy">
          <h1>Admin Login</h1>
          <p>Sign in with admin credentials to access dashboard.</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="Enter admin email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Enter admin password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </label>

          {error ? <p className="auth-message auth-message-error">{error}</p> : null}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'PLEASE WAIT…' : 'SIGN IN AS ADMIN'}
          </button>
        </form>
      </div>
    </section>
  );
}
