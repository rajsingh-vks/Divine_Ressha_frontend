'use client';

import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type Profile = {
  id?: string;
  email?: string;
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  store_name?: string | null;
  role?: 'customer' | 'vendor' | 'admin';
  status?: 'pending' | 'active' | 'inactive' | 'suspended' | 'deleted';
  email_verified?: boolean;
  created_at?: string;
  updated_at?: string | null;
};

type LocalAuthUser = {
  name?: string;
  email?: string;
};

type ProfileUpdatePayload = {
  full_name?: string | null;
  phone?: string | null;
  avatar_url?: string | null;
  bio?: string | null;
  store_name?: string | null;
};

const readToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem(AUTH_TOKEN_KEY) || '');
const hasSession = () => typeof window !== 'undefined' && localStorage.getItem(AUTH_SESSION_KEY) === '1';
const isAuthenticated = () => Boolean(readToken()) || hasSession();

const getAuthHeaders = () => {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const formatDate = (value?: string | null) => {
  if (!value) return 'Not available';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

const pillClass = (value?: string) => `profile-pill ${value || 'unknown'}`;

export default function ProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [localUser, setLocalUser] = useState<LocalAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<ProfileUpdatePayload>({});

  useEffect(() => {
    if (typeof window === 'undefined') return;

    const raw = localStorage.getItem(AUTH_USER_KEY);
    if (raw) {
      try {
        setLocalUser(JSON.parse(raw) as LocalAuthUser);
      } catch {
        setLocalUser(null);
      }
    }
  }, []);

  useEffect(() => {
    const loadProfile = async () => {
      if (!isAuthenticated()) {
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        const response = await fetch('/api/auth/profile', {
          method: 'GET',
          credentials: 'include',
          headers: getAuthHeaders(),
          cache: 'no-store',
        });

        if (!response.ok) {
          throw new Error('Unable to load profile details.');
        }

        const data = (await response.json()) as Profile;
        setProfile(data);
        setForm({
          full_name: data.full_name || localUser?.name || '',
          phone: data.phone || '',
          avatar_url: data.avatar_url || '',
          bio: data.bio || '',
          store_name: data.store_name || '',
        });
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to load profile details.');
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    void loadProfile();
  }, []);

  const displayName = useMemo(
    () => profile?.full_name || localUser?.name || 'Guest',
    [localUser?.name, profile?.full_name]
  );

  const displayEmail = profile?.email || localUser?.email || 'Not available';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DR';

  const handleChange = (field: keyof ProfileUpdatePayload) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: ProfileUpdatePayload = {
        full_name: form.full_name?.trim() || null,
        phone: form.phone?.trim() || null,
        avatar_url: form.avatar_url?.trim() || null,
        bio: form.bio?.trim() || null,
        store_name: form.store_name?.trim() || null,
      };

      const response = await fetch('/api/auth/profile', {
        method: 'PUT',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() || {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error('Unable to update profile.');
      }

      const updated = (await response.json()) as Profile;
      setProfile(updated);
      setEditing(false);

      if (typeof window !== 'undefined') {
        const currentRaw = localStorage.getItem(AUTH_USER_KEY);
        const current = currentRaw ? (JSON.parse(currentRaw) as LocalAuthUser) : {};
        localStorage.setItem(
          AUTH_USER_KEY,
          JSON.stringify({
            ...current,
            name: updated.full_name || current.name || '',
            email: updated.email || current.email || '',
          })
        );
        window.dispatchEvent(new Event('auth-change'));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="profile-shell">
      <div className="profile-hero-card">
        <div className="profile-avatar-wrap">
          {profile?.avatar_url ? (
            <Image
              src={proxyImageUrl(profile.avatar_url, '/images/logo_new.png')}
              alt={displayName}
              width={88}
              height={88}
              className="profile-avatar"
              unoptimized
            />
          ) : (
            <div className="profile-avatar profile-avatar-fallback" aria-hidden="true">
              {initials}
            </div>
          )}
        </div>

        <div className="profile-hero-copy">
          <p className="profile-overline">Account overview</p>
          <h1>{displayName}</h1>
          <p>{profile?.bio || 'Manage your Divine Ressha profile, account status, and contact details from one elegant dashboard.'}</p>

          <div className="profile-badges">
            <span className={pillClass(profile?.role)}>{profile?.role || 'customer'}</span>
            <span className={pillClass(profile?.status)}>{profile?.status || 'active'}</span>
            <span className="profile-pill verified">{profile?.email_verified ? 'Verified email' : 'Email pending'}</span>
          </div>

          <div className="profile-actions">
            <button type="button" className="profile-edit-button" onClick={() => setEditing((current) => !current)}>
              {editing ? 'Close editor' : 'Edit profile'}
            </button>
          </div>
        </div>
      </div>

      {loading ? (
        <div className="profile-content-card">
          <p className="profile-muted">Loading profile details…</p>
        </div>
      ) : (
        <>
          {error ? <p className="profile-message">{error}</p> : null}

          <div className="profile-grid">
            {editing ? (
              <article className="profile-content-card profile-full-width">
                <h2>Edit profile</h2>
                <form className="profile-edit-form" onSubmit={handleSave}>
                  <div className="profile-edit-grid">
                    <label>
                      <span>Full name</span>
                      <input type="text" value={form.full_name || ''} onChange={handleChange('full_name')} placeholder="Your full name" />
                    </label>
                    <label>
                      <span>Phone</span>
                      <input type="text" value={form.phone || ''} onChange={handleChange('phone')} placeholder="Phone number" />
                    </label>
                    <label className="profile-full-width-field">
                      <span>Avatar URL</span>
                      <input type="url" value={form.avatar_url || ''} onChange={handleChange('avatar_url')} placeholder="https://..." />
                    </label>
                    <label className="profile-full-width-field">
                      <span>Store name</span>
                      <input type="text" value={form.store_name || ''} onChange={handleChange('store_name')} placeholder="Store name" />
                    </label>
                    <label className="profile-full-width-field">
                      <span>Bio</span>
                      <textarea value={form.bio || ''} onChange={handleChange('bio')} rows={4} placeholder="A short bio about you or your store" />
                    </label>
                  </div>

                  <div className="profile-edit-actions">
                    <button type="submit" className="profile-save-button" disabled={saving}>
                      {saving ? 'Saving…' : 'Save changes'}
                    </button>
                    <button type="button" className="profile-cancel-button" onClick={() => setEditing(false)} disabled={saving}>
                      Cancel
                    </button>
                  </div>
                </form>
              </article>
            ) : null}

            <article className="profile-content-card">
              <h2>Identity</h2>
              <dl className="profile-dl-grid">
                <div><dt>Name</dt><dd>{displayName}</dd></div>
                <div><dt>Email</dt><dd>{displayEmail}</dd></div>
                <div><dt>Phone</dt><dd>{profile?.phone || 'Not available'}</dd></div>
                <div><dt>Store name</dt><dd>{profile?.store_name || 'Not available'}</dd></div>
              </dl>
            </article>

            <article className="profile-content-card">
              <h2>Account status</h2>
              <div className="profile-stats-grid">
                <div className="profile-stat-box"><span>Role</span><strong>{profile?.role || 'customer'}</strong></div>
                <div className="profile-stat-box"><span>Status</span><strong>{profile?.status || 'active'}</strong></div>
                <div className="profile-stat-box"><span>Email verified</span><strong>{profile?.email_verified ? 'Yes' : 'No'}</strong></div>
                <div className="profile-stat-box"><span>User ID</span><strong>{profile?.id || 'Not available'}</strong></div>
              </div>
            </article>

            <article className="profile-content-card profile-full-width">
              <h2>About</h2>
              <p className="profile-copy-text">{profile?.bio || 'No bio added yet.'}</p>
            </article>

            <article className="profile-content-card">
              <h2>Timeline</h2>
              <dl className="profile-dl-grid compact">
                <div><dt>Joined</dt><dd>{formatDate(profile?.created_at)}</dd></div>
                <div><dt>Last updated</dt><dd>{formatDate(profile?.updated_at)}</dd></div>
              </dl>
            </article>

            <article className="profile-content-card">
              <h2>Quick contact</h2>
              <div className="profile-quick-contact">
                <span>{displayEmail}</span>
                <small>{profile?.phone || 'No phone linked yet'}</small>
              </div>
            </article>
          </div>
        </>
      )}
    </section>
  );
}
