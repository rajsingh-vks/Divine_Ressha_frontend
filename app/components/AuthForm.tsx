'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY, hasStoredAuth } from '@/lib/constants/auth';

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

const COUNTRY_OPTIONS = [
  { label: 'India (+91)', value: '+91' },
  { label: 'United States (+1)', value: '+1' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'UAE (+971)', value: '+971' },
  { label: 'Australia (+61)', value: '+61' },
  { label: 'Singapore (+65)', value: '+65' },
  { label: 'Canada (+1)', value: '+1' },
];

const initialState = {
  name: '',
  email: '',
  phone: '',
  countryCode: '+91',
  password: '',
  confirmPassword: '',
  emailCode: '',
};

const normalizePhoneForBackend = (value: string, countryCode?: string) => {
  const raw = value.trim();
  if (!raw) return raw;

  const digits = raw.replace(/\D/g, '');
  if (!digits) return raw;

  const selectedCode = countryCode || '+91';
  const normalizedCountryCode = selectedCode.replace(/\D/g, '');

  if (digits.length === 10 && normalizedCountryCode === '91') return `+91${digits}`;
  if (digits.startsWith(normalizedCountryCode)) return `+${digits}`;
  if (normalizedCountryCode && digits.length > 10 && digits.startsWith('0')) return `+${normalizedCountryCode}${digits.slice(1)}`;
  if (normalizedCountryCode) return `+${normalizedCountryCode}${digits}`;

  return `+${digits}`;
};

const REMEMBER_EMAIL_KEY = 'divine_ressha_remember_email';

export default function AuthForm({ mode }: AuthFormProps) {
  const router = useRouter();
  const [form, setForm] = useState(initialState);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState('');
  const [signupVerificationId, setSignupVerificationId] = useState('');
  const [resendingVerification, setResendingVerification] = useState(false);
  const [signupStep, setSignupStep] = useState<'details' | 'verify'>('details');
  const [loginMethod, setLoginMethod] = useState<'password' | 'mobile'>('password');
  const [mobileLoginStep, setMobileLoginStep] = useState<'request' | 'verify'>('request');

  const isSignup = mode === 'signup';

  useEffect(() => {
    if (typeof window !== 'undefined' && hasStoredAuth()) {
      router.replace('/profile');
    }
  }, [mode, router]);

  useEffect(() => {
    if (typeof window === 'undefined' || isSignup) return;
    const rememberedEmail = localStorage.getItem(REMEMBER_EMAIL_KEY) || '';
    if (!rememberedEmail) return;

    setRememberMe(true);
    setForm((current) => ({ ...current, email: rememberedEmail }));
  }, [isSignup]);

  const title = useMemo(() => (isSignup ? 'Create account' : 'Welcome back'), [isSignup]);
  const subtitle = useMemo(
    () =>
      isSignup
        ? signupStep === 'details'
          ? 'Create your Divine Ressha account. We will send a verification code to your email.'
          : 'Enter the email verification code to complete your account setup.'
        : loginMethod === 'mobile'
          ? mobileLoginStep === 'request'
            ? 'Enter your mobile number to receive a verification code.'
            : 'Enter the 6-digit verification code sent to your mobile number.'
          : 'Sign in to continue your botanical ritual and access your account.',
    [isSignup, loginMethod, mobileLoginStep, signupStep]
  );

  const handleChange = (field: keyof typeof initialState) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
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

    if (isSignup && signupStep === 'details' && !acceptedTerms) {
      setError('Please accept the Terms & Conditions and Privacy Policy.');
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

    if (!isSignup && loginMethod === 'mobile' && mobileLoginStep === 'request' && !form.phone.trim()) {
      setError('Mobile number is required.');
      return;
    }

    if (!isSignup && loginMethod === 'mobile' && mobileLoginStep === 'verify' && !form.emailCode.trim()) {
      setError('Verification code is required.');
      return;
    }

    setLoading(true);

    try {
      const normalizedPhone = normalizePhoneForBackend(form.phone, form.countryCode);

      const endpoint = isSignup
        ? signupStep === 'details'
          ? '/api/auth/signup/initiate'
          : '/api/auth/signup/complete'
        : loginMethod === 'password'
          ? '/api/auth/login'
          : mobileLoginStep === 'request'
            ? '/api/auth/mobile-login/initiate'
            : '/api/auth/mobile-login/verify';

      const bodyPayload = isSignup
        ? signupStep === 'details'
          ? {
              full_name: form.name.trim() || undefined,
              email: form.email.trim(),
              phone: normalizedPhone,
              password: form.password,
            }
          : {
              full_name: form.name.trim() || undefined,
              email: form.email.trim(),
              phone: normalizedPhone,
              password: form.password,
              email_code: form.emailCode.trim(),
              ...(signupVerificationId ? { verification_id: signupVerificationId } : {}),
            }
        : loginMethod === 'password'
          ? {
              email: form.email.trim(),
              password: form.password,
            }
          : mobileLoginStep === 'request'
            ? {
                phone: normalizedPhone,
              }
            : {
                phone: normalizedPhone,
                otp: form.emailCode.trim(),
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

      if (!isSignup && loginMethod === 'mobile' && mobileLoginStep === 'request') {
        setMobileLoginStep('verify');
        setSuccess(data.message || 'Verification code sent to your mobile number.');
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

      if (!isSignup) {
        if (rememberMe) {
          localStorage.setItem(REMEMBER_EMAIL_KEY, form.email.trim());
        } else {
          localStorage.removeItem(REMEMBER_EMAIL_KEY);
        }
      }

      localStorage.setItem(AUTH_SESSION_KEY, '1');
      localStorage.setItem(AUTH_USER_KEY, JSON.stringify(userPayload));
      window.dispatchEvent(new Event('auth-change'));

      setSuccess(data.message || (isSignup ? 'Account created successfully.' : 'Logged in successfully.'));
      setForm(initialState);
      setAcceptedTerms(false);
      if (isSignup) {
        setSignupStep('details');
        setVerificationEmail('');
        setSignupVerificationId('');
      }
      if (!isSignup) {
        setLoginMethod('password');
        setMobileLoginStep('request');
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
                phone: normalizePhoneForBackend(form.phone, form.countryCode),
                password: form.password,
              }
            : { email: email.trim() }
        ),
      });

      const data = (await response.json()) as { detail?: string; message?: string };
      if (!response.ok) {
        throw new Error(data.detail || data.message || `Unable to resend verification${isSignup ? ' codes' : ' email'}.`);
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

          {!isSignup ? (
            <div className="auth-toggle" style={{ display: 'none', gap: '0.5rem', marginBottom: '1rem' }}>
              <button
                type="button"
                className={loginMethod === 'password' ? 'auth-submit' : 'checkout-link-button'}
                style={{ flex: 1, minHeight: '42px' }}
                onClick={() => {
                  setLoginMethod('password');
                  setMobileLoginStep('request');
                  setError('');
                  setSuccess('');
                }}
              >
                Email & Password
              </button>
              <button
                type="button"
                className={loginMethod === 'mobile' ? 'auth-submit' : 'checkout-link-button'}
                style={{ flex: 1, minHeight: '42px' }}
                onClick={() => {
                  setLoginMethod('mobile');
                  setMobileLoginStep('request');
                  setError('');
                  setSuccess('');
                }}
              >
                Mobile OTP
              </button>
            </div>
          ) : null}

          {!isSignup && loginMethod === 'password' ? (
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
          ) : null}

          {!isSignup && loginMethod === 'mobile' ? (
            <label className="auth-field">
              <span>Mobile number</span>
              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                <select
                  value={form.countryCode}
                  onChange={handleChange('countryCode')}
                  style={{ minWidth: '135px', padding: '0.8rem 0.75rem', borderRadius: '10px', border: '1px solid #dfe3ea', background: '#fff' }}
                  aria-label="Select country code"
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={`${country.label}-${country.value}`} value={country.value}>
                      {country.label}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  placeholder="Enter your mobile number"
                  value={form.phone}
                  onChange={handleChange('phone')}
                  required
                  style={{ flex: 1 }}
                />
              </div>
            </label>
          ) : null}

          {isSignup && signupStep === 'details' ? (
            <>
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
                <span>Mobile number</span>
                <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                  <select
                    value={form.countryCode}
                    onChange={handleChange('countryCode')}
                    style={{ minWidth: '135px', padding: '0.8rem 0.75rem', borderRadius: '10px', border: '1px solid #dfe3ea', background: '#fff' }}
                    aria-label="Select country code"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={`${country.label}-${country.value}`} value={country.value}>
                        {country.label}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    placeholder="Enter your mobile number"
                    value={form.phone}
                    onChange={handleChange('phone')}
                    required
                    style={{ flex: 1 }}
                  />
                </div>
              </label>
            </>
          ) : null}

          {(!isSignup || signupStep === 'details') && loginMethod === 'password' && (
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

          {isSignup && signupStep === 'details' ? (
            <label className="auth-consent">
              <input
                type="checkbox"
                checked={acceptedTerms}
                onChange={(event) => setAcceptedTerms(event.target.checked)}
                required
              />
              <span>
                I agree to the <Link href="/terms-conditions">Terms &amp; Conditions</Link> and <Link href="/privacy-policy">Privacy Policy</Link>.
              </span>
            </label>
          ) : null}

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
            </>
          ) : null}

          {!isSignup && loginMethod === 'mobile' && mobileLoginStep === 'verify' ? (
            <label className="auth-field">
              <span>Verification code</span>
              <input
                type="text"
                name="emailCode"
                placeholder="Enter 6-digit code"
                value={form.emailCode}
                onChange={handleChange('emailCode')}
                required
              />
            </label>
          ) : null}

          {!isSignup ? (
            <div className="auth-login-meta">
              {loginMethod === 'password' ? (
                <label className="auth-remember">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(event) => setRememberMe(event.target.checked)}
                  />
                  <span>Remember me</span>
                </label>
              ) : (
                <span className="checkout-muted">Use your mobile number to verify and sign in</span>
              )}
              {loginMethod === 'password' ? <Link href="/forgot-password">Forgot password?</Link> : null}
            </div>
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
            {loading
              ? 'PLEASE WAIT…'
              : isSignup
                ? signupStep === 'details'
                  ? 'SEND VERIFICATION CODE'
                  : 'VERIFY & CREATE ACCOUNT'
                : loginMethod === 'mobile'
                  ? mobileLoginStep === 'request'
                    ? 'SEND VERIFICATION CODE'
                    : 'VERIFY & SIGN IN'
                  : 'SIGN IN'}
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
        </div>
      </div>
    </section>
  );
}
