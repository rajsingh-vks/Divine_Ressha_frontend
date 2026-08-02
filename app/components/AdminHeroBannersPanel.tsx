'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';
import AdminSidebar from '@/app/components/AdminSidebar';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type AdminUser = { id?: string; email?: string; name?: string; role?: string };

type HeroBanner = {
  id: string;
  title: string;
  subtitle: string;
  image_url: string;
  is_active: boolean;
  display_order: number;
  created_at?: string;
  updated_at?: string;
};

type HeroBannerForm = {
  title: string;
  subtitle: string;
  display_order: string;
  is_active: boolean;
};

type FilterTab = 'All' | 'Active' | 'Inactive';
type ApiErrorPayload = { detail?: string | Array<{ msg?: string }>; message?: string };
type HeroBannerResponse = HeroBanner[] | { items?: unknown[]; data?: unknown[]; banners?: unknown[] };

const EMPTY_FORM: HeroBannerForm = {
  title: '',
  subtitle: '',
  display_order: '0',
  is_active: true,
};

const toStringOrEmpty = (value: unknown) => (typeof value === 'string' ? value : '');

const toNumberOrZero = (value: unknown) => {
  if (typeof value === 'number' && Number.isFinite(value)) return value;
  if (typeof value === 'string' && value.trim()) {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }
  return 0;
};

const toBoolean = (value: unknown) => {
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') return value.toLowerCase() === 'true';
  return Boolean(value);
};

const getApiErrorMessage = (payload: ApiErrorPayload, fallback: string) => {
  if (Array.isArray(payload.detail)) {
    const first = payload.detail[0];
    if (first?.msg) return first.msg;
  }

  if (typeof payload.detail === 'string') return payload.detail;
  if (payload.message) return payload.message;
  return fallback;
};

const mapHeroBanner = (raw: unknown): HeroBanner | null => {
  if (!raw || typeof raw !== 'object') return null;
  const record = raw as Record<string, unknown>;

  const id =
    toStringOrEmpty(record.id) ||
    toStringOrEmpty(record.banner_id) ||
    toStringOrEmpty(record._id);

  if (!id) return null;

  return {
    id,
    title: toStringOrEmpty(record.title),
    subtitle: toStringOrEmpty(record.subtitle),
    image_url: toStringOrEmpty(record.image_url) || toStringOrEmpty(record.image),
    is_active: toBoolean(record.is_active),
    display_order: toNumberOrZero(record.display_order),
    created_at: toStringOrEmpty(record.created_at),
    updated_at: toStringOrEmpty(record.updated_at),
  };
};

const normalizeHeroBanners = (payload: HeroBannerResponse): HeroBanner[] => {
  const list = Array.isArray(payload)
    ? payload
    : payload.items || payload.data || payload.banners || [];

  return list
    .map((item) => mapHeroBanner(item))
    .filter((item): item is HeroBanner => Boolean(item))
    .sort((a, b) => a.display_order - b.display_order);
};

export default function AdminHeroBannersPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [heroBanners, setHeroBanners] = useState<HeroBanner[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('All');
  const [loading, setLoading] = useState(false);
  const [fetchError, setFetchError] = useState('');

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBannerId, setEditingBannerId] = useState<string | null>(null);
  const [formData, setFormData] = useState<HeroBannerForm>({ ...EMPTY_FORM });
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>('');
  const [saving, setSaving] = useState(false);
  const [deletingBannerId, setDeletingBannerId] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const isSessionExpiredError = (status: number, message: string) =>
    status === 401 ||
    status === 403 ||
    /invalid or expired session|session expired|invalid session|token expired|not authenticated|unauthorized/i.test(message);

  const fetchHeroBanners = async () => {
    setLoading(true);
    setFetchError('');

    try {
      const response = await fetch('/api/admin/hero-banners', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      const payload = (await response.json()) as HeroBannerResponse | ApiErrorPayload;

      if (!response.ok) {
        const message = getApiErrorMessage(payload as ApiErrorPayload, 'Unable to fetch hero banners.');
        if (isSessionExpiredError(response.status, message)) {
          setFetchError('Session expired. Please login again.');
          return;
        }
        throw new Error(message);
      }

      setHeroBanners(normalizeHeroBanners(payload as HeroBannerResponse));
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to fetch hero banners.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const hasSession = localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
    const hasToken = Boolean(localStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
    const rawUser = localStorage.getItem(ADMIN_AUTH_USER_KEY);

    if (!hasSession && !hasToken) {
      router.replace('/admin/login');
      return;
    }

    if (!rawUser) {
      router.replace('/admin/login');
      return;
    }

    try {
      const parsed = JSON.parse(rawUser) as AdminUser;
      if (parsed.role !== 'admin') {
        router.replace('/admin/login');
        return;
      }
      setAdminUser(parsed);
      setReady(true);
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    void fetchHeroBanners();
  }, [ready]);

  const displayName = adminUser?.name || adminUser?.email || 'Admin';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    router.replace('/admin/login');
  };

  const filteredBanners = useMemo(() => {
    const needle = search.trim().toLowerCase();

    return heroBanners.filter((banner) => {
      const matchesFilter =
        filter === 'All' ||
        (filter === 'Active' && banner.is_active) ||
        (filter === 'Inactive' && !banner.is_active);

      const matchesSearch =
        !needle ||
        [banner.title, banner.subtitle]
          .join(' ')
          .toLowerCase()
          .includes(needle);

      return matchesFilter && matchesSearch;
    });
  }, [heroBanners, filter, search]);

  const closeModal = () => {
    setModalOpen(false);
    setEditingBannerId(null);
    setFormData({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview('');
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    setEditingBannerId(null);
    setFormData({ ...EMPTY_FORM });
    setImageFile(null);
    setImagePreview('');
    setModalOpen(true);
  };

  const openEditModal = (banner: HeroBanner) => {
    setEditingBannerId(banner.id);
    setFormData({
      title: banner.title,
      subtitle: banner.subtitle,
      display_order: String(banner.display_order),
      is_active: banner.is_active,
    });
    setImageFile(null);
    setImagePreview(banner.image_url ? proxyImageUrl(banner.image_url) : '');
    setModalOpen(true);
  };

  const handleField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  };

  const handleSave = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSaving(true);
    setFetchError('');

    if (!editingBannerId && !imageFile) {
      setFetchError('Hero banner image is required while creating a banner.');
      setSaving(false);
      return;
    }

    const payload = new FormData();
    payload.append('title', formData.title.trim());
    payload.append('subtitle', formData.subtitle.trim());

    if (formData.display_order.trim() !== '') {
      payload.append('display_order', String(Number(formData.display_order)));
    }

    payload.append('is_active', formData.is_active ? 'true' : 'false');

    if (imageFile) {
      payload.append('image', imageFile);
    }

    try {
      const response = await fetch(editingBannerId ? `/api/admin/hero-banners/${editingBannerId}` : '/api/admin/hero-banners', {
        method: editingBannerId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          ...(getAuthHeaders() || {}),
        },
        body: payload,
      });

      const text = await response.text();
      let result: ApiErrorPayload = {};
      try {
        result = text ? (JSON.parse(text) as ApiErrorPayload) : {};
      } catch {
        result = { message: text };
      }

      if (!response.ok) {
        const message = getApiErrorMessage(result, 'Unable to save hero banner.');
        if (isSessionExpiredError(response.status, message)) {
          setFetchError('Session expired. Please login again.');
          return;
        }
        throw new Error(message);
      }

      closeModal();
      await fetchHeroBanners();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to save hero banner.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (banner: HeroBanner) => {
    if (!window.confirm(`Delete hero banner "${banner.title}"?`)) return;

    setDeletingBannerId(banner.id);
    setFetchError('');

    try {
      const response = await fetch(`/api/admin/hero-banners/${banner.id}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        const text = await response.text();
        let result: ApiErrorPayload = {};
        try {
          result = text ? (JSON.parse(text) as ApiErrorPayload) : {};
        } catch {
          result = { message: text };
        }
        const message = getApiErrorMessage(result, 'Unable to delete hero banner.');
        if (isSessionExpiredError(response.status, message)) {
          setFetchError('Session expired. Please login again.');
          return;
        }
        throw new Error(message);
      }

      await fetchHeroBanners();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to delete hero banner.');
    } finally {
      setDeletingBannerId('');
    }
  };

  if (!ready) {
    return (
      <section className="admin-dashboard-shell">
        <div className="admin-dashboard-loading"><p>Loading…</p></div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard-shell">
      <div className="admin-dashboard-layout">
        <AdminSidebar displayName={displayName} initials={initials} onLogout={handleLogout} />

        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-search-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search hero banners by title or subtitle"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search hero banners"
              />
            </div>

            <div className="admin-user-pill">
              <span>{initials || 'AD'}</span>
              <div>
                <strong>{displayName}</strong>
                <small>Admin</small>
              </div>
            </div>
          </header>

          <section className="admin-page-heading">
            <div>
              <p className="admin-overline">Homepage</p>
              <h1 className="admin-page-title">Hero Banners</h1>
            </div>
            <div className="admin-page-actions">
              <button type="button" className="admin-ghost-button" onClick={() => void fetchHeroBanners()} disabled={loading}>
                {loading ? 'Refreshing…' : 'Refresh'}
              </button>
              <button type="button" className="admin-primary-button" onClick={openCreateModal}>
                + Add hero banner
              </button>
            </div>
          </section>

          {fetchError ? <p className="admin-products-error">{fetchError}</p> : null}

          <div className="admin-product-toolbar">
            <div className="admin-filter-tabs">
              {(['All', 'Active', 'Inactive'] as FilterTab[]).map((tab) => (
                <button
                  key={tab}
                  type="button"
                  className={`admin-filter-tab${filter === tab ? ' active' : ''}`}
                  onClick={() => setFilter(tab)}
                >
                  {tab}
                </button>
              ))}
            </div>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Hero Banner</th>
                  <th>Order</th>
                  <th>Status</th>
                  <th>Updated</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={5} className="admin-table-empty">Loading hero banners...</td></tr>
                ) : filteredBanners.length === 0 ? (
                  <tr><td colSpan={5} className="admin-table-empty">No hero banners found.</td></tr>
                ) : (
                  filteredBanners.map((banner) => (
                    <tr key={banner.id}>
                      <td>
                        <div className="admin-hero-banner-cell">
                          {banner.image_url ? (
                            <img
                              src={proxyImageUrl(banner.image_url)}
                              alt={banner.title}
                              className="admin-hero-banner-thumb"
                              onError={(event) => {
                                const target = event.currentTarget;
                                target.onerror = null;
                                target.src = '/images/banner_main.jpeg';
                              }}
                            />
                          ) : (
                            <span className="admin-hero-banner-thumb" aria-hidden="true" />
                          )}
                          <div>
                            <strong>{banner.title || 'Untitled hero banner'}</strong>
                            <small>{banner.subtitle || 'No subtitle'}</small>
                          </div>
                        </div>
                      </td>
                      <td>{banner.display_order}</td>
                      <td>
                        <span className={`admin-status-badge ${banner.is_active ? 'admin-status-active' : 'admin-status-archived'}`}>
                          {banner.is_active ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>{banner.updated_at ? new Date(banner.updated_at).toLocaleString() : '—'}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="admin-row-button" onClick={() => openEditModal(banner)}>
                            Edit
                          </button>
                          <button
                            type="button"
                            className="admin-row-button danger"
                            onClick={() => void handleDelete(banner)}
                            disabled={deletingBannerId === banner.id}
                          >
                            {deletingBannerId === banner.id ? 'Deleting…' : 'Delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </main>
      </div>

      {modalOpen ? (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>{editingBannerId ? 'Edit Hero Banner' : 'Create Hero Banner'}</h2>
              <button type="button" className="admin-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <form className="admin-product-form" onSubmit={handleSave}>
              <div className="admin-form-image-section">
                <span className="admin-form-image-label">Hero Image</span>
                <div className={`admin-image-dropzone${imagePreview ? ' has-image' : ''}`} onClick={() => fileInputRef.current?.click()}>
                  {imagePreview ? (
                    <img src={imagePreview} alt="Hero banner preview" className="admin-image-preview" />
                  ) : (
                    <div className="admin-image-placeholder">
                      <p>Click to upload hero image</p>
                      <small>PNG, JPG, WEBP</small>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="admin-image-input"
                    onChange={handleImageChange}
                    aria-label="Upload hero image"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <label className="admin-form-field admin-form-full">
                  <span>Title</span>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleField}
                    placeholder="Hero title"
                    required
                  />
                </label>

                <label className="admin-form-field admin-form-full">
                  <span>Subtitle</span>
                  <input
                    name="subtitle"
                    value={formData.subtitle}
                    onChange={handleField}
                    placeholder="Hero subtitle"
                    required
                  />
                </label>

                <label className="admin-form-field">
                  <span>Display Order</span>
                  <input
                    name="display_order"
                    value={formData.display_order}
                    onChange={handleField}
                    type="number"
                    min={0}
                  />
                </label>

                <label className="admin-form-field admin-checkbox-field">
                  <span>Active</span>
                  <input
                    type="checkbox"
                    checked={formData.is_active}
                    onChange={(event) => setFormData((prev) => ({ ...prev, is_active: event.target.checked }))}
                  />
                </label>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-ghost-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-primary-button" disabled={saving}>
                  {saving ? 'Saving…' : editingBannerId ? 'Update hero banner' : 'Create hero banner'}
                </button>
              </div>
            </form>
          </div>
        </div>
      ) : null}
    </section>
  );
}
