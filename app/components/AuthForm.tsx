'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';

type AuthMode = 'login' | 'signup';

type AuthFormProps = {
  mode: AuthMode;
};

type AuthResponse = {
  access_token?: string;
  accessToken?: string;
  auth_token?: string;
  token_type?: string;
  token?: string;
  tokens?: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
  } | null;
  message?: string;
  detail?: string;
  user?: unknown;
  email?: string;
  name?: string;
};

type AuthUser = {
  name?: string;
  full_name?: string;
  email?: string;
  email_verified?: boolean;
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
  const [verificationEmail, setVerificationEmail] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      (localStorage.getItem(AUTH_TOKEN_KEY) || localStorage.getItem(AUTH_SESSION_KEY) === '1')
    ) {
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
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          full_name: form.name.trim() || undefined,
          email: form.email,
          password: form.password,
        }),
      });

      const data = (await response.json()) as AuthResponse;

      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Authentication failed.');
      }

      const token = data.access_token || data.accessToken || data.auth_token || data.token || data.tokens?.access_token;
      const apiUser = typeof data.user === 'object' && data.user ? (data.user as AuthUser) : null;
      const userPayload = {
        name: data.name || apiUser?.full_name || apiUser?.name || form.name || '',
        email: data.email || apiUser?.email || form.email,
      };

      setVerificationEmail(userPayload.email || form.email);

      if (!token && !isSignup) {
        throw new Error(data.detail || data.message || 'Login succeeded without an access token.');
      }

      if (!token && isSignup) {
        localStorage.removeItem(AUTH_TOKEN_KEY);
        localStorage.removeItem(AUTH_SESSION_KEY);
        localStorage.removeItem(AUTH_USER_KEY);
        setSuccess(data.message || 'Account created. Please verify your email to continue.');
        setForm((current) => ({
          ...current,
          password: '',
          confirmPassword: '',
        }));
        return;
      }

      if (token) {
        localStorage.setItem(AUTH_TOKEN_KEY, token);
      }

      localStorage.setItem(AUTH_SESSION_KEY, '1');
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userPayload));
      window.dispatchEvent(new Event('auth-change'));

      setSuccess(data.message || (isSignup ? 'Account created successfully.' : 'Logged in successfully.'));
      setForm(initialState);
      router.replace('/profile');
      router.refresh();
      window.location.assign('/profile');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong.');
    } finally {
      setLoading(false);
    }
  };

  const handleResendVerification = async () => {
    const email = verificationEmail || form.email;
    if (!email) {
      setError('Enter your email to resend verification.');
      return;
    }

    setResendingVerification(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });

      const data = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Unable to resend verification email.');
      }

      setSuccess(data.message || 'Verification email sent. Please check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification email.');
    } finally {
      setResendingVerification(false);
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

          {isSignup && verificationEmail ? (
            <>
              <button className="auth-submit" type="button" onClick={handleResendVerification} disabled={resendingVerification || loading}>
                {resendingVerification ? 'SENDING…' : 'RESEND VERIFICATION EMAIL'}
              </button>
              <p className="auth-message">
                Already have a verification token? <Link href="/verify-email">Verify email</Link>
              </p>
            </>
          ) : null}

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
