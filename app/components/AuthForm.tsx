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
  detail?: string | Array<{ msg?: string }>;
  user?: unknown;
  email?: string;
  name?: string;
  phone?: string;
  mobile_verification_code?: string | null;
  email_verification_code?: string | null;
  verification_id?: string;
  signup_verification_id?: string;
  id?: string;
};

const getAuthErrorMessage = (data: AuthResponse, fallback: string) => {
  if (Array.isArray(data.detail)) return data.detail[0]?.msg || fallback;
  return data.detail || data.message || fallback;
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
  phone: '',
  password: '',
  confirmPassword: '',
  emailCode: '',
};

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [verificationEmail, setVerificationEmail] = useState('');
  const [signupVerificationId, setSignupVerificationId] = useState('');
  const [serverEmailCode, setServerEmailCode] = useState('');
  const [serverMobileCode, setServerMobileCode] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>('details');

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
        ? signupStep === 'details'
          ? 'Create your Divine Ressha account. We will send a verification code to your email.'
          : 'Enter the email verification code to complete your account setup.'
        : 'Sign in to continue your botanical ritual and access your account.',
    [isSignup, signupStep]
  );

  const handleChange = (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm((current) => ({ ...current, [field]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (isSignup && signupStep === 'details' && form.password !== form.confirmPassword) {
      setError('Passwords do not match.');
      return;
    }

    if (isSignup && signupStep === 'details' && !form.phone.trim()) {
      setError('Mobile number is required.');
      return;
    }

    if (isSignup && signupStep === 'verify' && !form.emailCode.trim()) {
      setError('Email verification code is required.');
      return;
    }

    setLoading(true);

    try {
      const endpoint = isSignup
        ? signupStep === 'details'
          ? '/api/auth/signup/initiate'
          : '/api/auth/signup/complete'
        : `/api/auth/${mode}`;

      const bodyPayload = isSignup
        ? signupStep === 'details'
          ? {
              full_name: form.name.trim() || undefined,
              email: form.email.trim(),
              phone: form.phone.trim(),
              password: form.password,
            }
          : {
              full_name: form.name.trim() || undefined,
              email: form.email.trim(),
              phone: form.phone.trim(),
              password: form.password,
              email_code: form.emailCode.trim(),
              mobile_code: (serverMobileCode || form.emailCode).trim(),
              ...(signupVerificationId ? { verification_id: signupVerificationId } : {}),
            }
        : {
            email: form.email.trim(),
            password: form.password,
          };

      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(bodyPayload),
      });

      const data = (await response.json()) as AuthResponse;

      if (!response.ok) {
        throw new Error(getAuthErrorMessage(data, 'Authentication failed.'));
      }

      if (isSignup && signupStep === 'details') {
        setSignupStep('verify');
        setVerificationEmail(form.email.trim());
        const fallbackEmailCode = (data.email_verification_code || '').trim();
        setServerEmailCode(fallbackEmailCode);
        if (fallbackEmailCode) {
          setForm((current) => ({
            ...current,
            emailCode: fallbackEmailCode,
          }));
        }
        setServerMobileCode((data.mobile_verification_code || '').trim());
        setSignupVerificationId(
          String(
            data.verification_id ||
              data.signup_verification_id ||
              data.id ||
              ''
          )
        );
        setSuccess(data.message || 'Verification code sent. Enter your email code to complete signup.');
        return;
      }

      const token = data.access_token || data.accessToken || data.auth_token || data.token || data.tokens?.access_token;
      const apiUser = typeof data.user === 'object' && data.user ? (data.user as AuthUser) : null;
      const userPayload = {
        name: data.name || apiUser?.full_name || apiUser?.name || form.name || '',
        email: data.email || apiUser?.email || form.email,
      };

      setVerificationEmail(userPayload.email || form.email);

      if (!token && !isSignup) {
        throw new Error(getAuthErrorMessage(data, 'Login succeeded without an access token.'));
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
          emailCode: '',
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
      if (isSignup) {
        setSignupStep('details');
        setVerificationEmail('');
        setSignupVerificationId('');
        setServerEmailCode('');
        setServerMobileCode('');
      }
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
      const response = await fetch(isSignup ? '/api/auth/signup/initiate' : '/api/auth/resend-verification', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(
          isSignup
            ? {
                full_name: form.name.trim() || undefined,
                email: email.trim(),
                phone: form.phone.trim(),
                password: form.password,
              }
            : { email: email.trim() }
        ),
      });

      const data = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.detail || data.message || `Unable to resend verification${isSignup ? ' codes' : ' email'}.`);
      }

      if (isSignup) {
        const payload = data as { email_verification_code?: string | null; mobile_verification_code?: string | null };
        const fallbackEmailCode = (payload.email_verification_code || '').trim();
        setServerEmailCode(fallbackEmailCode);
        if (fallbackEmailCode) {
          setForm((current) => ({
            ...current,
            emailCode: fallbackEmailCode,
          }));
        }
        setServerMobileCode((payload.mobile_verification_code || '').trim());
      }

      setSuccess(data.message || `Verification ${isSignup ? 'code sent' : 'email sent'}. Please check your inbox.`);
    } catch (err) {
      setError(err instanceof Error ? err.message : `Unable to resend verification${isSignup ? ' codes' : ' email'}.`);
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
          {isSignup && signupStep === 'details' && (
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
              disabled={isSignup && signupStep === 'verify'}
            />
          </label>

          {isSignup && signupStep === 'details' ? (
            <label className="auth-field">
              <span>Mobile number</span>
              <input
                type="tel"
                name="phone"
                placeholder="Enter your mobile number"
                value={form.phone}
                onChange={handleChange('phone')}
                required
              />
            </label>
          ) : null}

          {(!isSignup || signupStep === 'details') && (
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
          )}

          {isSignup && signupStep === 'details' && (
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

          {isSignup && signupStep === 'verify' ? (
            <>
              <label className="auth-field">
                <span>Email verification code</span>
                <input
                  type="text"
                  name="emailCode"
                  placeholder="Enter email code"
                  value={form.emailCode}
                  onChange={handleChange('emailCode')}
                  required
                />
              </label>
              {serverEmailCode ? (
                <p className="auth-message" style={{ marginTop: '-0.25rem' }}>
                  No email yet? Use test code: <strong>{serverEmailCode}</strong>
                </p>
              ) : null}
            </>
          ) : null}

          {error && <p className="auth-message auth-message-error">{error}</p>}
          {success && <p className="auth-message auth-message-success">{success}</p>}

          {isSignup && signupStep === 'verify' && verificationEmail ? (
            <>
              <button className="auth-submit" type="button" onClick={handleResendVerification} disabled={resendingVerification || loading}>
                {resendingVerification ? 'SENDING…' : 'RESEND CODE'}
              </button>
              <button
                className="auth-submit"
                type="button"
                onClick={() => {
                  setSignupStep('details');
                  setSignupVerificationId('');
                  setServerEmailCode('');
                  setServerMobileCode('');
                  setError('');
                  setSuccess('');
                }}
                disabled={loading || resendingVerification}
              >
                EDIT DETAILS
              </button>
              <p className="auth-message">
                Already have a verification token? <Link href="/verify-email">Verify email</Link>
              </p>
            </>
          ) : null}

          <button className="auth-submit" type="submit" disabled={loading}>
            {loading ? 'PLEASE WAIT…' : isSignup ? (signupStep === 'details' ? 'SEND VERIFICATION CODE' : 'VERIFY & CREATE ACCOUNT') : 'SIGN IN'}
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
