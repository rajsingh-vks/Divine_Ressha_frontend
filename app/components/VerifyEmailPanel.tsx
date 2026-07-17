'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';

export default function VerifyEmailPanel() {
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [email, setEmail] = useState('');
  const [loadingVerify, setLoadingVerify] = useState(false);
  const [loadingResend, setLoadingResend] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const tokenFromQuery = searchParams.get('token') || searchParams.get('code') || '';
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
    }
  }, [searchParams]);

  const handleVerify = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError('Verification token is required.');
      return;
    }

    setLoadingVerify(true);
    try {
      const response = await fetch('/api/auth/verify-email', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim() }),
      });

      const data = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Unable to verify email.');
      }

      setSuccess(data.message || 'Email verified successfully. You can now sign in.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify email.');
    } finally {
      setLoadingVerify(false);
    }
  };

  const handleResend = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required to resend verification.');
      return;
    }

    setLoadingResend(true);
    try {
      const response = await fetch('/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.detail || data.message || 'Unable to resend verification email.');
      }

      setSuccess(data.message || 'Verification email sent. Please check your inbox.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend verification email.');
    } finally {
      setLoadingResend(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-copy">
          <h1>Verify Email</h1>
          <p>Paste your verification token, or resend a new verification link to your email.</p>
        </div>

        <form className="auth-form" onSubmit={handleVerify}>
          <label className="auth-field">
            <span>Verification token</span>
            <input
              type="text"
              placeholder="Paste token from email"
              value={token}
              onChange={(event) => setToken(event.target.value)}
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loadingVerify}>
            {loadingVerify ? 'VERIFYING…' : 'VERIFY EMAIL'}
          </button>
        </form>

        <form className="auth-form" onSubmit={handleResend} style={{ marginTop: '1rem' }}>
          <label className="auth-field">
            <span>Email</span>
            <input
              type="email"
              placeholder="Enter your signup email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
            />
          </label>

          <button className="auth-submit" type="submit" disabled={loadingResend}>
            {loadingResend ? 'SENDING…' : 'RESEND VERIFICATION'}
          </button>
        </form>

        {error ? <p className="auth-message auth-message-error" style={{ marginTop: '1rem' }}>{error}</p> : null}
        {success ? <p className="auth-message auth-message-success" style={{ marginTop: '1rem' }}>{success}</p> : null}

        <div className="auth-links">
          <Link href="/login">Back to login</Link>
          <Link href="/signup">Back to signup</Link>
        </div>
      </div>
    </section>
  );
}
