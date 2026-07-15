'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';
import { proxyImageUrl } from '@/lib/utils/imageProxy';
import OrdersPanel from './OrdersPanel';

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

type Address = {
  id: string;
  full_name: string;
  phone: string;
  line1: string;
  line2?: string | null;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
  is_default?: boolean;
};

type AddressFormState = {
  full_name: string;
  phone: string;
  line1: string;
  line2: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  address_type: string;
  is_default: boolean;
};

const EMPTY_ADDRESS_FORM: AddressFormState = {
  full_name: '',
  phone: '',
  line1: '',
  line2: '',
  city: '',
  state: '',
  postal_code: '',
  country: 'India',
  address_type: 'home',
  is_default: false,
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string | Array<{ msg?: string }>; message?: string; error?: string };
    if (Array.isArray(payload.detail)) return payload.detail[0]?.msg || fallback;
    if (typeof payload.detail === 'string') return payload.detail;
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
};

const buildAddressLabel = (address: Address) =>
  [address.line1, address.line2, `${address.city}, ${address.state} ${address.postal_code}`, address.country]
    .filter(Boolean)
    .join(', ');

type ProfilePanelProps = {
  activeTab?: 'profile' | 'address' | 'order';
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

export default function ProfilePanel({ activeTab = 'profile' }: ProfilePanelProps) {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [localUser, setLocalUser] = useState<LocalAuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState('');
  const [addressSuccess, setAddressSuccess] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>({ ...EMPTY_ADDRESS_FORM });
  const [savingAddress, setSavingAddress] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState('');
  const [deletingId, setDeletingId] = useState('');
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

  const loadAddresses = async () => {
    setAddressesLoading(true);
    setAddressesError('');
    try {
      const response = await fetch('/api/addresses', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });
      if (!response.ok) throw new Error('Unable to load addresses.');
      const payload = (await response.json()) as Address[] | { items?: Address[]; data?: Address[] };
      const nextAddresses = Array.isArray(payload) ? payload : payload.items || payload.data || [];
      setAddresses(nextAddresses);
    } catch (err) {
      setAddressesError(err instanceof Error ? err.message : 'Unable to load addresses.');
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (activeTab !== 'address' || !isAuthenticated()) return;
    void loadAddresses();
    setShowAddressForm(false);
    setEditingAddressId(null);
    setAddressForm({ ...EMPTY_ADDRESS_FORM });
  }, [activeTab]);

  const displayName = useMemo(() => profile?.full_name || localUser?.name || 'Guest', [localUser?.name, profile?.full_name]);
  const displayEmail = profile?.email || localUser?.email || 'Not available';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('') || 'DR';
  const handleAddressField = (event: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = event.target;
    const checked = 'checked' in event.target ? (event.target as HTMLInputElement).checked : false;
    setAddressForm((current) => ({
      ...current,
      [name]: event.target instanceof HTMLInputElement && event.target.type === 'checkbox' ? checked : value,
    }));
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({ ...EMPTY_ADDRESS_FORM });
    setShowAddressForm(false);
  };

  const handleEditAddress = (address: Address) => {
    setEditingAddressId(address.id);
    setAddressForm({
      full_name: address.full_name,
      phone: address.phone,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      postal_code: address.postal_code,
      country: address.country,
      address_type: address.address_type,
      is_default: Boolean(address.is_default),
    });
    setShowAddressForm(true);
    setAddressSuccess('');
    setAddressesError('');
  };

  const handleSaveAddress = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAddress(true);
    setAddressesError('');
    setAddressSuccess('');
    const payload = { ...addressForm, line2: addressForm.line2 || null };
    try {
      const response = await fetch(
        editingAddressId ? `/api/addresses/${editingAddressId}` : '/api/addresses',
        {
          method: editingAddressId ? 'PUT' : 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json', ...(getAuthHeaders() || {}) },
          body: JSON.stringify(payload),
        }
      );
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to save address.'));
      await loadAddresses();
      setAddressSuccess(editingAddressId ? 'Address updated.' : 'Address saved.');
      resetAddressForm();
    } catch (err) {
      setAddressesError(err instanceof Error ? err.message : 'Unable to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this address?')) return;
    setDeletingId(addressId);
    setAddressesError('');
    setAddressSuccess('');
    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to delete address.'));
      await loadAddresses();
      setAddressSuccess('Address deleted.');
    } catch (err) {
      setAddressesError(err instanceof Error ? err.message : 'Unable to delete address.');
    } finally {
      setDeletingId('');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);
    setAddressesError('');
    setAddressSuccess('');
    try {
      const response = await fetch(`/api/addresses/${addressId}/default`, {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
      });
      if (!response.ok) throw new Error(await getApiErrorMessage(response, 'Unable to set default.'));
      await loadAddresses();
      setAddressSuccess('Default address updated.');
    } catch (err) {
      setAddressesError(err instanceof Error ? err.message : 'Unable to set default.');
    } finally {
      setSettingDefaultId('');
    }
  };

  const isProfileTab = activeTab === 'profile';
  const isAddressTab = activeTab === 'address';
  const isOrderTab = activeTab === 'order';

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
              <Link href="/profile/order" className={`profile-sidebar-link ${isOrderTab ? 'active' : ''}`}>
                <span>Order history</span>
                <strong>›</strong>
              </Link>
            </div>

            <div className="profile-sidebar-group">
              <p className="profile-sidebar-group-label">Account settings</p>
              <Link href="/profile" className={`profile-sidebar-link ${isProfileTab ? 'active' : ''}`}>
                <span>Profile information</span>
              </Link>
              <Link href="/profile/address" className={`profile-sidebar-link ${isAddressTab ? 'active' : ''}`}>
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

              {isProfileTab ? (
                <>
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
              ) : null}

              {isAddressTab ? (
                <section className="profile-panel-card">
                  <div className="profile-panel-head">
                    <div>
                      <p className="profile-section-label">Account settings</p>
                      <h1>Manage Addresses</h1>
                    </div>
                    {!showAddressForm ? (
                      <button
                        type="button"
                        className="profile-link-button"
                        onClick={() => { setShowAddressForm(true); setEditingAddressId(null); setAddressForm({ ...EMPTY_ADDRESS_FORM }); }}
                      >
                        + Add address
                      </button>
                    ) : null}
                  </div>

                  {addressesLoading ? <p className="profile-muted">Loading addresses…</p> : null}
                  {addressesError ? <p className="profile-message">{addressesError}</p> : null}
                  {addressSuccess ? <p className="profile-message profile-message-success">{addressSuccess}</p> : null}

                  {!addressesLoading && addresses.length ? (
                    <div className="profile-address-list">
                      {addresses.map((address) => (
                        <article key={address.id} className="profile-address-card">
                          <div className="profile-address-card-head">
                            <strong>{address.full_name}</strong>
                            {address.is_default ? <span className="profile-pill active">Default</span> : null}
                          </div>
                          <p>{buildAddressLabel(address)}</p>
                          <small>{address.phone} · {address.address_type}</small>
                          <div className="profile-address-actions">
                            {!address.is_default ? (
                              <button
                                type="button"
                                className="profile-addr-btn"
                                onClick={() => handleSetDefault(address.id)}
                                disabled={settingDefaultId === address.id}
                              >
                                {settingDefaultId === address.id ? 'Saving…' : 'Set default'}
                              </button>
                            ) : null}
                            <button
                              type="button"
                              className="profile-addr-btn"
                              onClick={() => handleEditAddress(address)}
                            >
                              Edit
                            </button>
                            <button
                              type="button"
                              className="profile-addr-btn danger"
                              onClick={() => handleDeleteAddress(address.id)}
                              disabled={deletingId === address.id}
                            >
                              {deletingId === address.id ? 'Deleting…' : 'Delete'}
                            </button>
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : !addressesLoading && !showAddressForm ? (
                    <div className="profile-empty-state">
                      <p>No saved addresses yet. Add your first address.</p>
                    </div>
                  ) : null}

                  {showAddressForm ? (
                    <form className="profile-address-form" onSubmit={handleSaveAddress}>
                      <p className="profile-section-label" style={{ margin: '0.5rem 0 0.75rem' }}>
                        {editingAddressId ? 'Edit address' : 'New address'}
                      </p>
                      <div className="profile-addr-form-grid">
                        <label className="profile-field">
                          <span>Full name</span>
                          <input name="full_name" value={addressForm.full_name} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field">
                          <span>Phone</span>
                          <input name="phone" value={addressForm.phone} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field profile-addr-full">
                          <span>Address line 1</span>
                          <input name="line1" value={addressForm.line1} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field profile-addr-full">
                          <span>Address line 2 (optional)</span>
                          <input name="line2" value={addressForm.line2} onChange={handleAddressField} />
                        </label>
                        <label className="profile-field">
                          <span>City</span>
                          <input name="city" value={addressForm.city} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field">
                          <span>State</span>
                          <input name="state" value={addressForm.state} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field">
                          <span>Postal code</span>
                          <input name="postal_code" value={addressForm.postal_code} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field">
                          <span>Country</span>
                          <input name="country" value={addressForm.country} onChange={handleAddressField} required />
                        </label>
                        <label className="profile-field">
                          <span>Address type</span>
                          <select name="address_type" value={addressForm.address_type} onChange={handleAddressField} className="profile-addr-select">
                            <option value="home">Home</option>
                            <option value="work">Work</option>
                            <option value="other">Other</option>
                          </select>
                        </label>
                        <label className="profile-field profile-addr-checkbox">
                          <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleAddressField} />
                          <span>Set as default address</span>
                        </label>
                      </div>
                      <div className="profile-edit-actions" style={{ marginTop: '1rem' }}>
                        <button type="submit" className="profile-save-button" disabled={savingAddress}>
                          {savingAddress ? 'Saving…' : editingAddressId ? 'Update address' : 'Save address'}
                        </button>
                        <button type="button" className="profile-cancel-button" onClick={resetAddressForm} disabled={savingAddress}>
                          Cancel
                        </button>
                      </div>
                    </form>
                  ) : null}
                </section>
              ) : null}

              {isOrderTab ? <OrdersPanel /> : null}
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
