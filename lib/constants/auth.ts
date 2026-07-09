export const BACKEND_API_URL = process.env.BACKEND_API_URL ?? 'http://localhost:8001';

export const AUTH_ENDPOINTS = {
  login: '/auth/login',
  signup: '/auth/signup',
} as const;

export const AUTH_TOKEN_KEY = 'divine_ressha_auth_token';
export const AUTH_USER_KEY = 'divine_ressha_auth_user';
