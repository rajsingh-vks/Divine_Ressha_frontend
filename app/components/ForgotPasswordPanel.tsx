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
  reset_token?: string;
  token?: string;
};

const getErrorMessage = (data: ApiPayload, fallback: string) => {
  if (Array.isArray(data.detail)) return data.detail[0]?.msg || fallback;
  return data.detail || data.message || fallback;
};

export default function ForgotPasswordPanel({ mode = 'forgot' }: ForgotPasswordPanelProps) {
  const searchParams = useSearchParams();
  const isResetMode = mode === 'reset';

  const [step, setStep] = useState<'request' | 'verify'>('request');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [token, setToken] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const tokenFromQuery = searchParams.get('token') || searchParams.get('code') || '';
    if (tokenFromQuery) {
      setToken(tokenFromQuery);
      setStep('verify');
    } else if (isResetMode) {
      setStep('verify');
    }
  }, [isResetMode, searchParams]);

  const isVerificationRequiredError = (message: string) =>
    /verify.*email|email.*verify|verification.*required|account.*not.*verified/i.test(message);

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
        const message = getErrorMessage(data, 'Unable to send reset email.');
        if (isVerificationRequiredError(message)) {
          setError(`${message} Please verify your email before continuing.`);
          return;
        }
        throw new Error(message);
      }

      setStep('verify');
      setOtp('');
      setToken('');
      setSuccess(data.message || 'A one-time reset code was sent to your email.');
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

  const handleVerifyOtp = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!email.trim()) {
      setError('Email is required.');
      return;
    }

    if (!otp.trim()) {
      setError('Reset code is required.');
      return;
    }

    setLoading(true);

    try {
      const response = await fetch('/api/auth/verify-reset-otp', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email: email.trim(), otp: otp.trim() }),
      });

      const data = (await response.json()) as ApiPayload;
      if (!response.ok) {
        const message = getErrorMessage(data, 'Unable to verify reset code.');
        throw new Error(message);
      }

      const nextToken = data.reset_token || data.token || '';
      if (!nextToken) {
        throw new Error('Reset token was not returned by the server.');
      }

      setToken(nextToken);
      setSuccess(data.message || 'Reset code verified. Please enter your new password.');
      setStep('verify');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to verify reset code.');
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError('');
    setSuccess('');

    if (!token.trim()) {
      setError('Please verify your reset code first.');
      return;
    }

    if (!email.trim()) {
      setError('Email is required before resetting the password.');
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
        body: JSON.stringify({ token: token.trim(), email: email.trim(), new_password: newPassword }),
      });

      const data = (await response.json()) as ApiPayload;
      if (!response.ok) {
        const message = getErrorMessage(data, 'Unable to reset password.');
        if (isVerificationRequiredError(message)) {
          setError(`${message} Please verify your email before setting a new password.`);
          return;
        }
        throw new Error(message);
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
              ? 'Enter your account email to receive a password reset code.'
              : 'Enter the reset code from your email, then choose a new password.'}
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
              {loading ? 'PLEASE WAIT…' : 'SEND RESET CODE'}
            </button>
          </form>
        ) : (
          <>
            <form className="auth-form" onSubmit={handleVerifyOtp}>
              <p className="auth-message" style={{ marginTop: '-0.25rem' }}>
                We sent a code to your email. Check spam/promotions or resend it.
              </p>

              <label className="auth-field">
                <span>Reset code</span>
                <input
                  type="text"
                  placeholder="Enter 6-digit code from email"
                  value={otp}
                  onChange={(event) => setOtp(event.target.value)}
                  required
                />
              </label>

              {error ? <p className="auth-message auth-message-error">{error}</p> : null}
              {success ? <p className="auth-message auth-message-success">{success}</p> : null}

              <button className="auth-submit" type="submit" disabled={loading}>
                {loading ? 'VERIFYING…' : 'VERIFY RESET CODE'}
              </button>

              <button
                className="auth-submit"
                type="button"
                onClick={handleResend}
                disabled={resending || loading}
              >
                {resending ? 'SENDING…' : 'RESEND RESET CODE'}
              </button>
            </form>

            <form className="auth-form" onSubmit={handleResetPassword} style={{ marginTop: '1rem' }}>
              <label className="auth-field">
                <span>Reset token</span>
                <input
                  type="text"
                  placeholder="Token returned after verification"
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
                onClick={() => {
                  setStep('request');
                  setOtp('');
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

              <p className="auth-message">
                Need to verify your email first? <Link href="/verify-email">Verify email</Link>
              </p>
            </form>
          </>
        )}

        <div className="auth-links">
          <Link href="/signup">Create account</Link>
        </div>
      </div>
    </section>
  );
}
