export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://13.126.80.31';

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/signup',
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
