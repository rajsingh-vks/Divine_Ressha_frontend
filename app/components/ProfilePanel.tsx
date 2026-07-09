'use client';

import { useEffect, useState } from 'react';
import { AUTH_USER_KEY } from '@/lib/constants/auth';

type AuthUser = {
  name?: string;
  email?: string;
};

export default function ProfilePanel() {
  const [user, setUser] = useState<AuthUser | null>(null);

  useEffect(() => {
    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (!raw) return;

    try {
      setUser(JSON.parse(raw) as AuthUser);
    } catch {
      setUser(null);
    }
  }, []);

  return (
    <section className="auth-page">
      <div className="auth-card profile-card">

        <div className="auth-copy">
          <h1>My Profile</h1>
          <p>Welcome back to your botanical ritual.</p>
        </div>

        <div className="profile-summary">
          <div>
            <span>Name</span>
            <strong>{user?.name || 'Guest'}</strong>
          </div>
          <div>
            <span>Email</span>
            <strong>{user?.email || 'Not available'}</strong>
          </div>
        </div>
      </div>
    </section>
  );
}
