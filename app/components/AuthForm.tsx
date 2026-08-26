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
  { label: 'Afghanistan (+93)', value: '+93' },
  { label: 'Albania (+355)', value: '+355' },
  { label: 'Algeria (+213)', value: '+213' },
  { label: 'Andorra (+376)', value: '+376' },
  { label: 'Angola (+244)', value: '+244' },
  { label: 'Antigua and Barbuda (+1)', value: '+1' },
  { label: 'Argentina (+54)', value: '+54' },
  { label: 'Armenia (+374)', value: '+374' },
  { label: 'Australia (+61)', value: '+61' },
  { label: 'Austria (+43)', value: '+43' },
  { label: 'Azerbaijan (+994)', value: '+994' },
  { label: 'Bahamas (+1)', value: '+1' },
  { label: 'Bahrain (+973)', value: '+973' },
  { label: 'Bangladesh (+880)', value: '+880' },
  { label: 'Barbados (+1)', value: '+1' },
  { label: 'Belarus (+375)', value: '+375' },
  { label: 'Belgium (+32)', value: '+32' },
  { label: 'Belize (+501)', value: '+501' },
  { label: 'Benin (+229)', value: '+229' },
  { label: 'Bhutan (+975)', value: '+975' },
  { label: 'Bolivia (+591)', value: '+591' },
  { label: 'Bosnia and Herzegovina (+387)', value: '+387' },
  { label: 'Botswana (+267)', value: '+267' },
  { label: 'Brazil (+55)', value: '+55' },
  { label: 'Brunei (+673)', value: '+673' },
  { label: 'Bulgaria (+359)', value: '+359' },
  { label: 'Burkina Faso (+226)', value: '+226' },
  { label: 'Burundi (+257)', value: '+257' },
  { label: 'Cabo Verde (+238)', value: '+238' },
  { label: 'Cambodia (+855)', value: '+855' },
  { label: 'Cameroon (+237)', value: '+237' },
  { label: 'Canada (+1)', value: '+1' },
  { label: 'Central African Republic (+236)', value: '+236' },
  { label: 'Chad (+235)', value: '+235' },
  { label: 'Chile (+56)', value: '+56' },
  { label: 'China (+86)', value: '+86' },
  { label: 'Colombia (+57)', value: '+57' },
  { label: 'Comoros (+269)', value: '+269' },
  { label: 'Congo (Brazzaville) (+242)', value: '+242' },
  { label: 'Costa Rica (+506)', value: '+506' },
  { label: 'Côte d’Ivoire (+225)', value: '+225' },
  { label: 'Croatia (+385)', value: '+385' },
  { label: 'Cuba (+53)', value: '+53' },
  { label: 'Cyprus (+357)', value: '+357' },
  { label: 'Czech Republic (+420)', value: '+420' },
  { label: 'Democratic Republic of the Congo (+243)', value: '+243' },
  { label: 'Denmark (+45)', value: '+45' },
  { label: 'Djibouti (+253)', value: '+253' },
  { label: 'Dominica (+1)', value: '+1' },
  { label: 'Dominican Republic (+1)', value: '+1' },
  { label: 'Ecuador (+593)', value: '+593' },
  { label: 'Egypt (+20)', value: '+20' },
  { label: 'El Salvador (+503)', value: '+503' },
  { label: 'Equatorial Guinea (+240)', value: '+240' },
  { label: 'Eritrea (+291)', value: '+291' },
  { label: 'Estonia (+372)', value: '+372' },
  { label: 'Eswatini (+268)', value: '+268' },
  { label: 'Ethiopia (+251)', value: '+251' },
  { label: 'Fiji (+679)', value: '+679' },
  { label: 'Finland (+358)', value: '+358' },
  { label: 'France (+33)', value: '+33' },
  { label: 'Gabon (+241)', value: '+241' },
  { label: 'Gambia (+220)', value: '+220' },
  { label: 'Georgia (+995)', value: '+995' },
  { label: 'Germany (+49)', value: '+49' },
  { label: 'Ghana (+233)', value: '+233' },
  { label: 'Greece (+30)', value: '+30' },
  { label: 'Grenada (+1)', value: '+1' },
  { label: 'Guatemala (+502)', value: '+502' },
  { label: 'Guinea (+224)', value: '+224' },
  { label: 'Guinea-Bissau (+245)', value: '+245' },
  { label: 'Guyana (+592)', value: '+592' },
  { label: 'Haiti (+509)', value: '+509' },
  { label: 'Honduras (+504)', value: '+504' },
  { label: 'Hungary (+36)', value: '+36' },
  { label: 'Iceland (+354)', value: '+354' },
  { label: 'India (+91)', value: '+91' },
  { label: 'Indonesia (+62)', value: '+62' },
  { label: 'Iran (+98)', value: '+98' },
  { label: 'Iraq (+964)', value: '+964' },
  { label: 'Ireland (+353)', value: '+353' },
  { label: 'Israel (+972)', value: '+972' },
  { label: 'Italy (+39)', value: '+39' },
  { label: 'Jamaica (+1)', value: '+1' },
  { label: 'Japan (+81)', value: '+81' },
  { label: 'Jordan (+962)', value: '+962' },
  { label: 'Kazakhstan (+7)', value: '+7' },
  { label: 'Kenya (+254)', value: '+254' },
  { label: 'Kiribati (+686)', value: '+686' },
  { label: 'Kuwait (+965)', value: '+965' },
  { label: 'Kyrgyzstan (+996)', value: '+996' },
  { label: 'Laos (+856)', value: '+856' },
  { label: 'Latvia (+371)', value: '+371' },
  { label: 'Lebanon (+961)', value: '+961' },
  { label: 'Lesotho (+266)', value: '+266' },
  { label: 'Liberia (+231)', value: '+231' },
  { label: 'Libya (+218)', value: '+218' },
  { label: 'Liechtenstein (+423)', value: '+423' },
  { label: 'Lithuania (+370)', value: '+370' },
  { label: 'Luxembourg (+352)', value: '+352' },
  { label: 'Madagascar (+261)', value: '+261' },
  { label: 'Malawi (+265)', value: '+265' },
  { label: 'Malaysia (+60)', value: '+60' },
  { label: 'Maldives (+960)', value: '+960' },
  { label: 'Mali (+223)', value: '+223' },
  { label: 'Malta (+356)', value: '+356' },
  { label: 'Marshall Islands (+692)', value: '+692' },
  { label: 'Mauritania (+222)', value: '+222' },
  { label: 'Mauritius (+230)', value: '+230' },
  { label: 'Mexico (+52)', value: '+52' },
  { label: 'Micronesia (+691)', value: '+691' },
  { label: 'Moldova (+373)', value: '+373' },
  { label: 'Monaco (+377)', value: '+377' },
  { label: 'Mongolia (+976)', value: '+976' },
  { label: 'Montenegro (+382)', value: '+382' },
  { label: 'Morocco (+212)', value: '+212' },
  { label: 'Mozambique (+258)', value: '+258' },
  { label: 'Myanmar (+95)', value: '+95' },
  { label: 'Namibia (+264)', value: '+264' },
  { label: 'Nauru (+674)', value: '+674' },
  { label: 'Nepal (+977)', value: '+977' },
  { label: 'Netherlands (+31)', value: '+31' },
  { label: 'New Zealand (+64)', value: '+64' },
  { label: 'Nicaragua (+505)', value: '+505' },
  { label: 'Niger (+227)', value: '+227' },
  { label: 'Nigeria (+234)', value: '+234' },
  { label: 'North Korea (+850)', value: '+850' },
  { label: 'North Macedonia (+389)', value: '+389' },
  { label: 'Norway (+47)', value: '+47' },
  { label: 'Oman (+968)', value: '+968' },
  { label: 'Pakistan (+92)', value: '+92' },
  { label: 'Palau (+680)', value: '+680' },
  { label: 'Palestine (+970)', value: '+970' },
  { label: 'Panama (+507)', value: '+507' },
  { label: 'Papua New Guinea (+675)', value: '+675' },
  { label: 'Paraguay (+595)', value: '+595' },
  { label: 'Peru (+51)', value: '+51' },
  { label: 'Philippines (+63)', value: '+63' },
  { label: 'Poland (+48)', value: '+48' },
  { label: 'Portugal (+351)', value: '+351' },
  { label: 'Qatar (+974)', value: '+974' },
  { label: 'Romania (+40)', value: '+40' },
  { label: 'Russia (+7)', value: '+7' },
  { label: 'Rwanda (+250)', value: '+250' },
  { label: 'Saint Kitts and Nevis (+1)', value: '+1' },
  { label: 'Saint Lucia (+1)', value: '+1' },
  { label: 'Saint Vincent and the Grenadines (+1)', value: '+1' },
  { label: 'Samoa (+685)', value: '+685' },
  { label: 'San Marino (+378)', value: '+378' },
  { label: 'Sao Tome and Principe (+239)', value: '+239' },
  { label: 'Saudi Arabia (+966)', value: '+966' },
  { label: 'Senegal (+221)', value: '+221' },
  { label: 'Serbia (+381)', value: '+381' },
  { label: 'Seychelles (+248)', value: '+248' },
  { label: 'Sierra Leone (+232)', value: '+232' },
  { label: 'Singapore (+65)', value: '+65' },
  { label: 'Slovakia (+421)', value: '+421' },
  { label: 'Slovenia (+386)', value: '+386' },
  { label: 'Solomon Islands (+677)', value: '+677' },
  { label: 'Somalia (+252)', value: '+252' },
  { label: 'South Africa (+27)', value: '+27' },
  { label: 'South Korea (+82)', value: '+82' },
  { label: 'South Sudan (+211)', value: '+211' },
  { label: 'Spain (+34)', value: '+34' },
  { label: 'Sri Lanka (+94)', value: '+94' },
  { label: 'Sudan (+249)', value: '+249' },
  { label: 'Suriname (+597)', value: '+597' },
  { label: 'Sweden (+46)', value: '+46' },
  { label: 'Switzerland (+41)', value: '+41' },
  { label: 'Syria (+963)', value: '+963' },
  { label: 'Taiwan (+886)', value: '+886' },
  { label: 'Tajikistan (+992)', value: '+992' },
  { label: 'Tanzania (+255)', value: '+255' },
  { label: 'Thailand (+66)', value: '+66' },
  { label: 'Timor-Leste (+670)', value: '+670' },
  { label: 'Togo (+228)', value: '+228' },
  { label: 'Tonga (+676)', value: '+676' },
  { label: 'Trinidad and Tobago (+1)', value: '+1' },
  { label: 'Tunisia (+216)', value: '+216' },
  { label: 'Turkey (+90)', value: '+90' },
  { label: 'Turkmenistan (+993)', value: '+993' },
  { label: 'Tuvalu (+688)', value: '+688' },
  { label: 'Uganda (+256)', value: '+256' },
  { label: 'Ukraine (+380)', value: '+380' },
  { label: 'United Arab Emirates (+971)', value: '+971' },
  { label: 'United Kingdom (+44)', value: '+44' },
  { label: 'United States (+1)', value: '+1' },
  { label: 'Uruguay (+598)', value: '+598' },
  { label: 'Uzbekistan (+998)', value: '+998' },
  { label: 'Vanuatu (+678)', value: '+678' },
  { label: 'Vatican City (+379)', value: '+379' },
  { label: 'Venezuela (+58)', value: '+58' },
  { label: 'Vietnam (+84)', value: '+84' },
  { label: 'Yemen (+967)', value: '+967' },
  { label: 'Zambia (+260)', value: '+260' },
  { label: 'Zimbabwe (+263)', value: '+263' },
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

const formatCountryCodeLabel = (country: { label: string; value: string }) => {
  const baseName = country.label.replace(/\s*\(\+\d+\)\s*$/, '').trim();
  const shortCountryName = baseName.slice(0, 3).toUpperCase();
  return `${shortCountryName} ${country.value}`;
};

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
    const value = field === 'phone' ? e.target.value.replace(/\D/g, '') : e.target.value;
    setForm((current) => ({ ...current, [field]: value }));
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
                  style={{ minWidth: '110px', maxWidth: '110px', padding: '0.8rem 0.5rem', borderRadius: '10px', border: '1px solid #dfe3ea', background: '#fff', textAlign: 'center' }}
                  aria-label="Select country code"
                >
                  {COUNTRY_OPTIONS.map((country) => (
                    <option key={`${country.label}-${country.value}`} value={country.value}>
                      {formatCountryCodeLabel(country)}
                    </option>
                  ))}
                </select>
                <input
                  type="tel"
                  name="phone"
                  inputMode="numeric"
                  pattern="[0-9]*"
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
                    style={{ minWidth: '110px', maxWidth: '110px', padding: '0.8rem 0.5rem', border: '1px solid #dfe3ea', background: '#fff', textAlign: 'center' }}
                    aria-label="Select country code"
                  >
                    {COUNTRY_OPTIONS.map((country) => (
                      <option key={`${country.label}-${country.value}`} value={country.value}>
                        {formatCountryCodeLabel(country)}
                      </option>
                    ))}
                  </select>
                  <input
                    type="tel"
                    name="phone"
                    inputMode="numeric"
                    pattern="[0-9]*"
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
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.1rem' }}>
                <button
                  type="button"
                  onClick={handleResendVerification}
                  disabled={resendingVerification || loading}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    // borderRadius: '12px',
                    border: '1px solid #d5cdbb',
                    background: '#f4efe6',
                    color: '#171511',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: resendingVerification || loading ? 'not-allowed' : 'pointer',
                    opacity: resendingVerification || loading ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  {resendingVerification ? 'Sending…' : 'Resend code'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSignupStep('details');
                    setSignupVerificationId('');
                    setError('');
                    setSuccess('');
                  }}
                  disabled={loading || resendingVerification}
                  style={{
                    flex: 1,
                    minHeight: '44px',
                    // borderRadius: '12px',
                    border: '1px solid #d5cdbb',
                    background: '#ffffff',
                    color: '#171511',
                    fontSize: '0.74rem',
                    fontWeight: 700,
                    letterSpacing: '0.12em',
                    textTransform: 'uppercase',
                    cursor: loading || resendingVerification ? 'not-allowed' : 'pointer',
                    opacity: loading || resendingVerification ? 0.7 : 1,
                    transition: 'all 0.2s ease',
                  }}
                >
                  Edit details
                </button>
              </div>
              <p className="auth-message">
                Already have a verification token? <Link href="/verify-email">Verify email</Link>
              </p>
            </>
          ) : null}

          <button className="auth-submit" type="submit" disabled={loading} style={{ marginTop: '0.4rem' }}>
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
