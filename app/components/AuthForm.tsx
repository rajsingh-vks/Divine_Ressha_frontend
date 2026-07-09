'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';

type AuthMode = 'login' | 'signup';

type AuthFormProps = {
  mode: AuthMode;
};

type AuthResponse = {
  access_token?: string;
  token?: string;
  message?: string;
  detail?: string;
  user?: unknown;
  email?: string;
  name?: string;
};

const initialState = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (typeof window !== 'undefined' && localStorage.getItem(AUTH_TOKEN_KEY)) {
      router.replace('/profile');
    }
  }, [mode, router]);

  const title = useMemo(() => (isSignup ? 'Create account' : 'Welcome back'), [isSignup]);
  const subtitle = useMemo(
    () =>
      isSignup
        ? 'Create your Divine Ressha account to save your ritual and continue to checkout.'
        : 'Sign in to continue your botanical ritual and access your account.',
    [isSignup]
  );

  const handleChange = (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isSignup && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(`/api/auth/${mode}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: form.name,
          email: form.email,
          password: form.password,
        }),
      });

      const data = (await response.json()) as AuthResponse;

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Authentication failed.');
      }

      const token = data.access_token || data.token;
      const userPayload = {
        name: data.name || form.name || (typeof data.user === 'object' && data.user ? (data.user as { name?: string }).name : ''),
        email: data.email || form.email || (typeof data.user === 'object' && data.user ? (data.user as { email?: string }).email : ''),
      };

      localStorage.setItem(AUTH_TOKEN_KEY, token || 'authenticated');
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userPayload));
      window.dispatchEvent(new Event('auth-change'));

      setSuccess(data.message || (isSignup ? 'Account created successfully.' : 'Logged in successfully.'));
      setForm(initialState);
      router.replace('/profile');
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">

        <div className="auth-copy">
          <h1>{title}</h1>
          <p>{subtitle}</p>
        </div>

        <form className="auth-form" onSubmit={handleSubmit}>
          {isSignup && (
            <label className="auth-field">
              <span>Full name</span>
              <input
                type="text"
                name="name"
                placeholder="Enter your full name"
                value={form.name}
                onChange={handleChange('name')}
                required={isSignup}
              />
            </label>
          )}

          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              name="email"
              placeholder="Enter your email"
              value={form.email}
              onChange={handleChange('email')}
              required
            />
          </label>

          <label className="auth-field">
            <span>Password</span>
            <input
              type="password"
              name="password"
              placeholder="Enter your password"
              value={form.password}
              onChange={handleChange('password')}
              required
            />
          </label>

          {isSignup && (
            <label className="auth-field">
              <span>Confirm password</span>
              <input
                type="password"
                name="confirmPassword"
                placeholder="Confirm your password"
                value={form.confirmPassword}
                onChange={handleChange('confirmPassword')}
                required={isSignup}
              />
            </label>
          )}

          {error && <p className="auth-message auth-message-error">{error}</p>}
          {success && <p className="auth-message auth-message-success">{success}</p>}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'PLEASE WAIT…' : isSignup ? 'CREATE ACCOUNT' : 'SIGN IN'}
          </button>
        </form>

        <div className="auth-links">
          {isSignup ? (
            <p>
              Already have an account? <Link href="/login">Sign in</Link>
            </p>
          ) : (
            <p>
              New here? <Link href="/signup">Create account</Link>
            </p>
          )}
          <Link href="/">Back to home</Link>
        </div>
      </div>
    </section>
  );
}
