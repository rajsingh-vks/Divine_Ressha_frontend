'use client';

import Link from 'next/link';
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

type EditableForm = {
  first_name: string;
  last_name: string;
  phone: string;
  avatar_url: string;
  bio: string;
  store_name: string;
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

const splitName = (name?: string | null) => {
  const trimmed = (name || '').trim();
  if (!trimmed) return { first_name: '', last_name: '' };
  const parts = trimmed.split(/\s+/);
  return { first_name: parts[0] || '', last_name: parts.slice(1).join(' ') };
};

export default function ProfilePanel() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [localUser, setLocalUser] = useState<LocalAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<EditableForm>({
    first_name: '',
    last_name: '',
    phone: '',
    avatar_url: '',
    bio: '',
    store_name: '',
  });

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
        const { first_name, last_name } = splitName(data.full_name || localUser?.name || '');
        setForm({
          first_name,
          last_name,
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

  const displayName = useMemo(() => profile?.full_name || localUser?.name || 'Guest', [localUser?.name, profile?.full_name]);
  const displayEmail = profile?.email || localUser?.email || 'Not available';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DR';

  const handleChange = (field: keyof EditableForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setForm((current) => ({
      ...current,
      [field]: event.target.value,
    }));
  };

  const syncLocalUser = (updated: Profile) => {
    if (typeof window === 'undefined') return;

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
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setError('');

    try {
      const payload: ProfileUpdatePayload = {
        full_name: [form.first_name.trim(), form.last_name.trim()].filter(Boolean).join(' ') || null,
        phone: form.phone.trim() || null,
        avatar_url: form.avatar_url.trim() || null,
        bio: form.bio.trim() || null,
        store_name: form.store_name.trim() || null,
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
      syncLocalUser(updated);
      setEditing(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const activeRole = profile?.role || 'customer';
  const activeStatus = profile?.status || 'active';

  return (
    <section className="profile-account-shell">
      <div className="profile-account-layout">
        <aside className="profile-sidebar">
          <div className="profile-sidebar-card profile-greeting-card">
            <div className="profile-greeting-avatar">
              {profile?.avatar_url ? (
                <Image
                  src={proxyImageUrl(profile.avatar_url, '/images/logo_new.png')}
                  alt={displayName}
                  width={56}
                  height={56}
                  className="profile-greeting-image"
                  unoptimized
                />
              ) : (
                <span>{initials}</span>
              )}
            </div>
            <div>
              <p>Hello,</p>
              <strong>{displayName}</strong>
            </div>
          </div>

          <nav className="profile-sidebar-nav" aria-label="Account sections">
            <div className="profile-sidebar-group">
              <p className="profile-sidebar-group-label">My orders</p>
              <Link href="/orders" className="profile-sidebar-link">
                <span>Order history</span>
                <strong>›</strong>
              </Link>
            </div>

            <div className="profile-sidebar-group">
              <p className="profile-sidebar-group-label">Account settings</p>
              <span className="profile-sidebar-link active">
                <span>Profile information</span>
              </span>
              <Link href="/checkout" className="profile-sidebar-link">
                <span>Manage addresses</span>
              </Link>
            </div>

            <div className="profile-sidebar-group">
              <p className="profile-sidebar-group-label">Payments</p>
              <span className="profile-sidebar-link muted">
                <span>Saved cards</span>
              </span>
              <span className="profile-sidebar-link muted">
                <span>Saved UPI</span>
              </span>
            </div>

            <div className="profile-sidebar-group">
              <p className="profile-sidebar-group-label">My stuff</p>
              <Link href="/wishlist" className="profile-sidebar-link">
                <span>Wishlist</span>
              </Link>
              <Link href="/cart" className="profile-sidebar-link">
                <span>Cart</span>
              </Link>
            </div>
          </nav>
        </aside>

        <main className="profile-main-panel">
          {loading ? (
            <div className="profile-panel-card">
              <p className="profile-muted">Loading profile details…</p>
            </div>
          ) : (
            <>
              {error ? <p className="profile-message">{error}</p> : null}

              <section className="profile-panel-card">
                <div className="profile-panel-head">
                  <div>
                    <p className="profile-section-label">Personal information</p>
                    <h1>Profile Information</h1>
                  </div>
                  <button type="button" className="profile-link-button" onClick={() => setEditing((current) => !current)}>
                    {editing ? 'Close' : 'Edit'}
                  </button>
                </div>

                <form className="profile-info-form" onSubmit={handleSave}>
                  <div className="profile-field-grid">
                    <label className="profile-field">
                      <span>First name</span>
                      <input type="text" value={form.first_name} onChange={handleChange('first_name')} disabled={!editing} placeholder="First name" />
                    </label>

                    <label className="profile-field">
                      <span>Last name</span>
                      <input type="text" value={form.last_name} onChange={handleChange('last_name')} disabled={!editing} placeholder="Last name" />
                    </label>
                  </div>

                  <div className="profile-field-section">
                    <div className="profile-field-section-head">
                      <strong>Email Address</strong>
                      <button type="button" className="profile-inline-link" disabled>
                        Edit
                      </button>
                    </div>
                    <input type="email" value={displayEmail} readOnly disabled className="profile-readonly-input" />
                  </div>

                  <div className="profile-field-section">
                    <div className="profile-field-section-head">
                      <strong>Mobile Number</strong>
                      <button type="button" className="profile-inline-link" onClick={() => setEditing(true)}>
                        Edit
                      </button>
                    </div>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={handleChange('phone')}
                      disabled={!editing}
                      placeholder="Add mobile number"
                      className="profile-text-input"
                    />
                  </div>

                  <div className="profile-field-grid profile-field-grid-single">
                    <label className="profile-field">
                      <span>Avatar URL</span>
                      <input type="url" value={form.avatar_url} onChange={handleChange('avatar_url')} disabled={!editing} placeholder="https://..." />
                    </label>

                    <label className="profile-field">
                      <span>Store name</span>
                      <input type="text" value={form.store_name} onChange={handleChange('store_name')} disabled={!editing} placeholder="Store name" />
                    </label>
                  </div>

                  <div className="profile-field-section">
                    <div className="profile-field-section-head">
                      <strong>About</strong>
                    </div>
                    <textarea
                      value={form.bio}
                      onChange={handleChange('bio')}
                      disabled={!editing}
                      rows={4}
                      className="profile-textarea"
                      placeholder="Write something about you or your store"
                    />
                  </div>

                  <div className="profile-info-meta">
                    <div>
                      <span>Role</span>
                      <strong className={pillClass(activeRole)}>{activeRole}</strong>
                    </div>
                    <div>
                      <span>Status</span>
                      <strong className={pillClass(activeStatus)}>{activeStatus}</strong>
                    </div>
                    <div>
                      <span>Email verified</span>
                      <strong className={profile?.email_verified ? 'profile-pill active' : 'profile-pill pending'}>
                        {profile?.email_verified ? 'Yes' : 'No'}
                      </strong>
                    </div>
                    <div>
                      <span>User ID</span>
                      <strong>{profile?.id || 'Not available'}</strong>
                    </div>
                  </div>

                  {editing ? (
                    <div className="profile-edit-actions">
                      <button type="submit" className="profile-save-button" disabled={saving}>
                        {saving ? 'Saving…' : 'Save'}
                      </button>
                      <button
                        type="button"
                        className="profile-cancel-button"
                        onClick={() => {
                          const { first_name, last_name } = splitName(profile?.full_name || localUser?.name || '');
                          setForm({
                            first_name,
                            last_name,
                            phone: profile?.phone || '',
                            avatar_url: profile?.avatar_url || '',
                            bio: profile?.bio || '',
                            store_name: profile?.store_name || '',
                          });
                          setEditing(false);
                        }}
                        disabled={saving}
                      >
                        Cancel
                      </button>
                    </div>
                  ) : null}
                </form>
              </section>

              <div className="profile-quick-grid">
                <article className="profile-panel-card compact">
                  <h2>About</h2>
                  <p className="profile-copy-text">{profile?.bio || 'No bio added yet.'}</p>
                </article>

                <article className="profile-panel-card compact">
                  <h2>Timeline</h2>
                  <dl className="profile-timeline-grid">
                    <div>
                      <dt>Joined</dt>
                      <dd>{formatDate(profile?.created_at)}</dd>
                    </div>
                    <div>
                      <dt>Last updated</dt>
                      <dd>{formatDate(profile?.updated_at)}</dd>
                    </div>
                  </dl>
                </article>
              </div>
            </>
          )}
        </main>
      </div>
    </section>
  );
}
/*
            throw new Error('Unable to load profile details.');
          }

          const data = (await response.json()) as Profile;
          setProfile(data);
          const { first_name, last_name } = splitName(data.full_name || localUser?.name || '');
          setForm({
            first_name,
            last_name,
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

    const displayName = useMemo(() => profile?.full_name || localUser?.name || 'Guest', [localUser?.name, profile?.full_name]);
    const displayEmail = profile?.email || localUser?.email || 'Not available';
    const initials = displayName
      .split(' ')
      .filter(Boolean)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('') || 'DR';

    const handleChange = (field: keyof EditableForm) => (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      setForm((current) => ({
        ...current,
        [field]: event.target.value,
      }));
    };

    const syncLocalUser = (updated: Profile) => {
      if (typeof window === 'undefined') return;

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
    };

    const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
      event.preventDefault();
      setSaving(true);
      setError('');

      try {
        const payload: ProfileUpdatePayload = {
          full_name: [form.first_name.trim(), form.last_name.trim()].filter(Boolean).join(' ') || null,
          phone: form.phone.trim() || null,
          avatar_url: form.avatar_url.trim() || null,
          bio: form.bio.trim() || null,
          store_name: form.store_name.trim() || null,
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
        syncLocalUser(updated);
        setEditing(false);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to update profile.');
      } finally {
        setSaving(false);
      }
    };

    const activeRole = profile?.role || 'customer';
    const activeStatus = profile?.status || 'active';

    return (
      <section className="profile-account-shell">
        <div className="profile-account-layout">
          <aside className="profile-sidebar">
            <div className="profile-sidebar-card profile-greeting-card">
              <div className="profile-greeting-avatar">
                {profile?.avatar_url ? (
                  <Image
                    src={proxyImageUrl(profile.avatar_url, '/images/logo_new.png')}
                    alt={displayName}
                    width={56}
                    height={56}
                    className="profile-greeting-image"
                    unoptimized
                  />
                ) : (
                  <span>{initials}</span>
                )}
              </div>
              <div>
                <p>Hello,</p>
                <strong>{displayName}</strong>
              </div>
            </div>

            <nav className="profile-sidebar-nav" aria-label="Account sections">
              <div className="profile-sidebar-group">
                <p className="profile-sidebar-group-label">My orders</p>
                <Link href="/orders" className="profile-sidebar-link">
                  <span>Order history</span>
                  <strong>›</strong>
                </Link>
              </div>

              <div className="profile-sidebar-group">
                <p className="profile-sidebar-group-label">Account settings</p>
                <span className="profile-sidebar-link active">
                  <span>Profile information</span>
                </span>
                <Link href="/checkout" className="profile-sidebar-link">
                  <span>Manage addresses</span>
                </Link>
              </div>

              <div className="profile-sidebar-group">
                <p className="profile-sidebar-group-label">Payments</p>
                <span className="profile-sidebar-link muted">
                  <span>Saved cards</span>
                </span>
                <span className="profile-sidebar-link muted">
                  <span>Saved UPI</span>
                </span>
              </div>

              <div className="profile-sidebar-group">
                <p className="profile-sidebar-group-label">My stuff</p>
                <Link href="/wishlist" className="profile-sidebar-link">
                  <span>Wishlist</span>
                </Link>
                <Link href="/cart" className="profile-sidebar-link">
                  <span>Cart</span>
                </Link>
              </div>
            </nav>
          </aside>

          <main className="profile-main-panel">
            {loading ? (
              <div className="profile-panel-card">
                <p className="profile-muted">Loading profile details…</p>
              </div>
            ) : (
              <>
                {error ? <p className="profile-message">{error}</p> : null}

                <section className="profile-panel-card">
                  <div className="profile-panel-head">
                    <div>
                      <p className="profile-section-label">Personal information</p>
                      <h1>Profile Information</h1>
                    </div>
                    <button type="button" className="profile-link-button" onClick={() => setEditing((current) => !current)}>
                      {editing ? 'Close' : 'Edit'}
                    </button>
                  </div>

                  <form className="profile-info-form" onSubmit={handleSave}>
                    <div className="profile-field-grid">
                      <label className="profile-field">
                        <span>First name</span>
                        <input type="text" value={form.first_name} onChange={handleChange('first_name')} disabled={!editing} placeholder="First name" />
                      </label>

                      <label className="profile-field">
                        <span>Last name</span>
                        <input type="text" value={form.last_name} onChange={handleChange('last_name')} disabled={!editing} placeholder="Last name" />
                      </label>
                    </div>

                    <div className="profile-field-section">
                      <div className="profile-field-section-head">
                        <strong>Email Address</strong>
                        <button type="button" className="profile-inline-link" disabled>
                          Edit
                        </button>
                      </div>
                      <input type="email" value={displayEmail} readOnly disabled className="profile-readonly-input" />
                    </div>

                    <div className="profile-field-section">
                      <div className="profile-field-section-head">
                        <strong>Mobile Number</strong>
                        <button type="button" className="profile-inline-link" onClick={() => setEditing(true)}>
                          Edit
                        </button>
                      </div>
                      <input
                        type="text"
                        value={form.phone}
                        onChange={handleChange('phone')}
                        disabled={!editing}
                        placeholder="Add mobile number"
                        className="profile-text-input"
                      />
                    </div>

                    <div className="profile-field-grid profile-field-grid-single">
                      <label className="profile-field">
                        <span>Avatar URL</span>
                        <input type="url" value={form.avatar_url} onChange={handleChange('avatar_url')} disabled={!editing} placeholder="https://..." />
                      </label>

                      <label className="profile-field">
                        <span>Store name</span>
                        <input type="text" value={form.store_name} onChange={handleChange('store_name')} disabled={!editing} placeholder="Store name" />
                      </label>
                    </div>

                    <div className="profile-field-section">
                      <div className="profile-field-section-head">
                        <strong>About</strong>
                      </div>
                      <textarea
                        value={form.bio}
                        onChange={handleChange('bio')}
                        disabled={!editing}
                        rows={4}
                        className="profile-textarea"
                        placeholder="Write something about you or your store"
                      />
                    </div>

                    <div className="profile-info-meta">
                      <div>
                        <span>Role</span>
                        <strong className={pillClass(activeRole)}>{activeRole}</strong>
                      </div>
                      <div>
                        <span>Status</span>
                        <strong className={pillClass(activeStatus)}>{activeStatus}</strong>
                      </div>
                      <div>
                        <span>Email verified</span>
                        <strong className={profile?.email_verified ? 'profile-pill active' : 'profile-pill pending'}>
                          {profile?.email_verified ? 'Yes' : 'No'}
                        </strong>
                      </div>
                      <div>
                        <span>User ID</span>
                        <strong>{profile?.id || 'Not available'}</strong>
                      </div>
                    </div>

                    {editing ? (
                      <div className="profile-edit-actions">
                        <button type="submit" className="profile-save-button" disabled={saving}>
                          {saving ? 'Saving…' : 'Save'}
                        </button>
                        <button
                          type="button"
                          className="profile-cancel-button"
                          onClick={() => {
                            const { first_name, last_name } = splitName(profile?.full_name || localUser?.name || '');
                            setForm({
                              first_name,
                              last_name,
                              phone: profile?.phone || '',
                              avatar_url: profile?.avatar_url || '',
                              bio: profile?.bio || '',
                              store_name: profile?.store_name || '',
                            });
                            setEditing(false);
                          }}
                          disabled={saving}
                        >
                          Cancel
                        </button>
                      </div>
                    ) : null}
                  </form>
                </section>

                <div className="profile-quick-grid">
                  <article className="profile-panel-card compact">
                    <h2>About</h2>
                    <p className="profile-copy-text">{profile?.bio || 'No bio added yet.'}</p>
                  </article>

                  <article className="profile-panel-card compact">
                    <h2>Timeline</h2>
                    <dl className="profile-timeline-grid">
                      <div>
                        <dt>Joined</dt>
                        <dd>{formatDate(profile?.created_at)}</dd>
                      </div>
                      <div>
                        <dt>Last updated</dt>
                        <dd>{formatDate(profile?.updated_at)}</dd>
                      </div>
                    </dl>
                  </article>
                </div>
              </>
            )}
          </main>
        </div>
      </section>
    );
  }
*/
