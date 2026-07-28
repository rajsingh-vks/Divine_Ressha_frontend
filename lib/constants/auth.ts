const normalize = (value?: string | null) => {
  const trimmed = (value || '').trim().replace(/\/+$/, '');
  return trimmed.replace(/\/api$/i, '');
};

const isFrontendOrigin = (value: string) => {
  if (!value) return false;

  try {
    const url = new URL(value);
    return ['divineressha.com', 'www.divineressha.com', 'localhost:3000', '127.0.0.1:3000'].includes(url.host);
  } catch {
    return false;
  }
};

const configuredBackendUrl = normalize(process.env.BACKEND_API_URL);
const configuredPublicApiUrl = normalize(process.env.NEXT_PUBLIC_API_URL);
const fallbackBackendUrl = normalize(process.env.BACKEND_API_URL_FALLBACK || 'https://api.divineressha.com');

const resolvedProductionBackendUrl =
  (configuredBackendUrl && !isFrontendOrigin(configuredBackendUrl) ? configuredBackendUrl : '') ||
  (configuredPublicApiUrl && !isFrontendOrigin(configuredPublicApiUrl) ? configuredPublicApiUrl : '') ||
  fallbackBackendUrl;

export const BACKEND_API_URL =
  process.env.NODE_ENV === 'development'
    ? configuredBackendUrl || configuredPublicApiUrl || 'http://localhost:8001'
    : resolvedProductionBackendUrl;

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/signup',
  signupInitiate: '/auth/signup/initiate',
  signupComplete: '/auth/signup/complete',
  profile: '/auth/profile',
  verifyEmail: '/auth/verify-email',
  resendVerification: '/auth/resend-verification',
} as const;

export const AUTH_TOKEN_KEY = 'divine_ressha_auth_token';
export const AUTH_USER_KEY = 'divine_ressha_auth_user';
export const AUTH_SESSION_KEY = 'divine_ressha_auth_session';

export const ADMIN_AUTH_TOKEN_KEY = 'divine_ressha_admin_auth_token';
export const ADMIN_AUTH_USER_KEY = 'divine_ressha_admin_auth_user';
export const ADMIN_AUTH_SESSION_KEY = 'divine_ressha_admin_auth_session';
