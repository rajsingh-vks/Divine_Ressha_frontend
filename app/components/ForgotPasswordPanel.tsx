'use client';

import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useEffect, useState } from 'react';

type ForgotPasswordPanelProps = {
  mode?: 'forgot' | 'reset';
};

type ApiPayload = {
  detail?: string | Array<{ msg?: string }>;
  message?: string;
};

const getErrorMessage = (data: ApiPayload, fallback: string) => {
  if (Array.isArray(data.detail)) return data.detail[0]?.msg || fallback;
  return data.detail || data.message || fallback;
};

export default function ForgotPasswordPanel({ mode = 'forgot' }: ForgotPasswordPanelProps) {
  const searchParams = useSearchParams();
  const isResetMode = mode === 'reset';

  const [step, setStep] = useState<'request' | 'verify'>(isResetMode ? 'verify' : 'request');
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    if (isResetMode) setStep('verify');
    const tokenFromQuery = searchParams.get('token') || searchParams.get('code') || '';
    if (!tokenFromQuery) return;
    setToken(tokenFromQuery);
    setStep('verify');
  }, [isResetMode, searchParams]);

  const handleRequestCode = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/forgot-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await response.json()) as ApiPayload;
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to send reset email.'));
      }

      setStep('verify');
      setSuccess(data.message || 'Reset instructions sent. Check your email and open the reset link.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to send reset email.');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Enter your email first, then resend.');
      return;
    }

    setResending(true);
    try {
      const response = await fetch('/api/auth/resend-reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim() }),
      });

      const data = (await response.json()) as ApiPayload;
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to resend reset email.'));
      }

      setSuccess(data.message || 'Reset email sent again. Please check inbox and spam folder.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to resend reset email.');
    } finally {
      setResending(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError('Reset token is required.');
      return;
    }

    if (newPassword.length < 8) {
      setError('New password must be at least 8 characters.');
      return;
    }

    if (newPassword !== confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/reset-password', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: token.trim(), new_password: newPassword }),
      });

      const data = (await response.json()) as ApiPayload;
      if (!response.ok) {
        throw new Error(getErrorMessage(data, 'Unable to reset password.'));
      }

      setSuccess(data.message || 'Password reset successful. You can now sign in.');
      setNewPassword('');
      setConfirmPassword('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to reset password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <section className="auth-page">
      <div className="auth-card">
        <div className="auth-copy">
          <h1>{isResetMode ? 'Reset Password' : 'Forgot Password'}</h1>
          <p>
            {step === 'request'
              ? 'Enter your account email to receive password reset instructions.'
              : 'Open the reset email link or paste the reset token to set your new password.'}
          </p>
        </div>

        {step === 'request' ? (
          <form className="auth-form" onSubmit={handleRequestCode}>
            <label className="auth-field">
              <span>Email</span>
              <input
                type="email"
                placeholder="Enter your account email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
              />
            </label>

            {error ? <p className="auth-message auth-message-error">{error}</p> : null}
            {success ? <p className="auth-message auth-message-success">{success}</p> : null}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'PLEASE WAIT…' : 'SEND RESET EMAIL'}
            </button>
          </form>
        ) : (
          <form className="auth-form" onSubmit={handleResetPassword}>
            <p className="auth-message" style={{ marginTop: '-0.25rem' }}>
              Not receiving email? Check spam/promotions or resend.
            </p>

            <label className="auth-field">
              <span>Reset token</span>
              <input
                type="text"
                placeholder="Enter token from reset email"
                value={token}
                onChange={(event) => setToken(event.target.value)}
                required
              />
            </label>

            <label className="auth-field">
              <span>New password</span>
              <input
                type="password"
                placeholder="Enter new password"
                value={newPassword}
                onChange={(event) => setNewPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            <label className="auth-field">
              <span>Confirm new password</span>
              <input
                type="password"
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                minLength={8}
                required
              />
            </label>

            {error ? <p className="auth-message auth-message-error">{error}</p> : null}
            {success ? <p className="auth-message auth-message-success">{success}</p> : null}

            <button className="auth-submit" type="submit" disabled={loading}>
              {loading ? 'PLEASE WAIT…' : 'RESET PASSWORD'}
            </button>

            <button
              className="auth-submit"
              type="button"
              onClick={handleResend}
              disabled={resending || loading}
            >
              {resending ? 'SENDING…' : 'RESEND RESET EMAIL'}
            </button>

            <button
              className="auth-submit"
              type="button"
              onClick={() => {
                setStep('request');
                setToken('');
                setNewPassword('');
                setConfirmPassword('');
                setError('');
                setSuccess('');
              }}
              disabled={loading}
            >
              USE DIFFERENT EMAIL
            </button>
          </form>
        )}

        <div className="auth-links">
          <Link href="/signup">Create account</Link>
        </div>
      </div>
    </section>
  );
}
