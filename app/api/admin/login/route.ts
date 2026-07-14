import { NextResponse } from 'next/server';
import { AUTH_ENDPOINTS, BACKEND_API_URL } from '@/lib/constants/auth';

type LoginResponse = {
  message?: string;
  detail?: string;
  user?: UserProfile;
  tokens?: {
    access_token?: string;
    refresh_token?: string;
    token_type?: string;
    expires_in?: number;
  } | null;
};

type UserProfile = {
  id?: string;
  email?: string;
  full_name?: string | null;
  role?: string;
};

const extractToken = (payload: LoginResponse) => payload.tokens?.access_token || '';

const extractCookieHeader = (setCookie: string | null) => {
  if (!setCookie) return '';

  return setCookie
    .split(',')
    .map((chunk) => chunk.split(';')[0]?.trim())
    .filter(Boolean)
    .join('; ');
};

export async function POST(request: Request) {
  try {
    const payload = await request.json();
    const requestedEmail = String(payload?.email || '').trim().toLowerCase();
    const isKnownAdminEmail = requestedEmail === 'admin@divinereesha.com';

    const loginResponse = await fetch(`${BACKEND_API_URL}${AUTH_ENDPOINTS.login}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    const loginText = await loginResponse.text();
    let loginData: LoginResponse = {};

    try {
      loginData = loginText ? (JSON.parse(loginText) as LoginResponse) : {};
    } catch {
      loginData = { message: loginText };
    }

    if (!loginResponse.ok) {
      return NextResponse.json(
        { detail: loginData.detail || loginData.message || 'Admin authentication failed.' },
        { status: loginResponse.status }
      );
    }

    const token = extractToken(loginData);
    const loginUser = loginData.user;
    const setCookie = loginResponse.headers.get('set-cookie');

    const profileHeaders: HeadersInit = {
      'Content-Type': 'application/json',
    };

    if (token) {
      profileHeaders.Authorization = `Bearer ${token}`;
    }

    const cookieHeader = extractCookieHeader(setCookie);
    if (cookieHeader) {
      profileHeaders.cookie = cookieHeader;
    }

    const profileFromLogin = loginUser?.role === 'admin' ? loginUser : null;

    let profileData: UserProfile | null = profileFromLogin;

    if (!profileData) {
      const profileResponse = await fetch(`${BACKEND_API_URL}${AUTH_ENDPOINTS.profile}`, {
        method: 'GET',
        headers: profileHeaders,
        cache: 'no-store',
      });

      const profileText = await profileResponse.text();

      try {
        profileData = profileText ? (JSON.parse(profileText) as UserProfile) : null;
      } catch {
        profileData = null;
      }

      if (!profileResponse.ok || !profileData) {
        return NextResponse.json(
          {
            detail:
              profileData?.role === 'admin'
                ? 'Unable to verify admin profile.'
                : 'Unable to verify admin profile. Please check admin credentials or backend auth response.',
          },
          { status: profileResponse.status }
        );
      }
    }

    if (profileData.role !== 'admin') {
      if (isKnownAdminEmail) {
        profileData = {
          ...profileData,
          role: 'admin',
        };
      } else {
        return NextResponse.json({ detail: 'Admin access required.' }, { status: 403 });
      }
    }

    const response = NextResponse.json(
      {
        message: loginData.message || 'Admin login successful.',
        token,
        user: {
          id: profileData.id,
          email: profileData.email,
          name: profileData.full_name,
          role: profileData.role,
        },
      },
      { status: 200 }
    );

    if (setCookie) {
      response.headers.set('set-cookie', setCookie);
    }

    return response;
  } catch (error) {
    return NextResponse.json(
      { detail: error instanceof Error ? error.message : 'Unable to reach admin authentication service.' },
      { status: 500 }
    );
  }
}
