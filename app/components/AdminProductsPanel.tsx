'use client';

import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';
import AdminSidebar from '@/app/components/AdminSidebar';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type AdminUser = { id?: string; email?: string; name?: string; role?: string };

type Product = {
  id: string;
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  fragrance: string;
  pack_size: string;
  form: string;
  usage: string;
  price: number;
  stock: number;
  sku: string;
  status: 'Active' | 'Draft' | 'Archived';
  image_url: string;
  created_at?: string;
  updated_at?: string;
};

type ProductForm = {
  name: string;
  category: string;
  subcategory: string;
  brand: string;
  fragrance: string;
  pack_size: string;
  form: string;
  usage: string;
  price: string;
  stock: string;
  sku: string;
  status: 'Active' | 'Draft' | 'Archived';
  image_url: string;
};

const EMPTY_FORM: ProductForm = {
  name: '',
  category: '',
  subcategory: '',
  brand: 'Divine Reesha',
  fragrance: '',
  pack_size: '',
  form: '',
  usage: '',
  price: '',
  stock: '',
  sku: '',
  status: 'Active' as const,
  image_url: '',
};

type FilterTab = 'All' | 'Active' | 'Draft' | 'Archived';

type ProductResponse = Product[] | { items?: Product[]; data?: Product[] };
type ApiErrorPayload = { detail?: string | Array<{ msg?: string }>; message?: string };

const normalizeProducts = (payload: ProductResponse): Product[] => {
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || [];
};

const readAsDataUrl = (file: File) =>
  new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ''));
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

const getApiErrorMessage = (payload: ApiErrorPayload, fallback: string) => {
  if (Array.isArray(payload.detail)) {
    const first = payload.detail[0];
    if (first?.msg) return first.msg;
  }

  if (typeof payload.detail === 'string') return payload.detail;
  if (payload.message) return payload.message;
  return fallback;
};

export default function AdminProductsPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [products, setProducts] = useState<Product[]>([]);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<FilterTab>('All');
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState<ProductForm>({ ...EMPTY_FORM });
  const [saving, setSaving] = useState(false);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [editingProductId, setEditingProductId] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    return token
      ? {
          Authorization: `Bearer ${token}`,
        }
      : undefined;
  };

  const fetchProducts = async () => {
    setLoadingProducts(true);
    setFetchError('');

    try {
      const response = await fetch('/api/admin/products', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      const payload = (await response.json()) as ProductResponse | { detail?: string; message?: string };

      if (!response.ok) {
        const detail = 'detail' in payload ? payload.detail : undefined;
        const message = 'message' in payload ? payload.message : undefined;
        throw new Error(detail || message || 'Unable to fetch products.');
      }

      setProducts(normalizeProducts(payload as ProductResponse));
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to fetch products.');
    } finally {
      setLoadingProducts(false);
    }
  };

  useEffect(() => {
    const hasSession = localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
    const hasToken = Boolean(localStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
    const rawUser = localStorage.getItem(ADMIN_AUTH_USER_KEY);
    if (!hasSession && !hasToken) { router.replace('/admin/login'); return; }
    if (!rawUser) { router.replace('/admin/login'); return; }
    try {
      const parsed = JSON.parse(rawUser) as AdminUser;
      if (parsed.role !== 'admin') { router.replace('/admin/login'); return; }
      setAdminUser(parsed);
      setReady(true);
    } catch { router.replace('/admin/login'); }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    fetchProducts();
  }, [ready]);

  const displayName = adminUser?.name || adminUser?.email || 'Admin';
  const initials = displayName.split(' ').filter(Boolean).slice(0, 2).map((p) => p[0]?.toUpperCase()).join('');

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    router.replace('/admin/login');
  };

  const filteredProducts = products.filter((p) => {
    const matchesFilter = filter === 'All' || p.status === filter;
    const matchesSearch =
      !search ||
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.sku.toLowerCase().includes(search.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  const handleField = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const setImageFromFile = async (file: File) => {
    const base64 = await readAsDataUrl(file);
    setImageFile(file);
    setImagePreview(base64);
    setFormData((prev) => ({ ...prev, image_url: base64 }));
  };

  const handleImageChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    await setImageFromFile(file);
  };

  const clearImage = () => {
    setImageFile(null);
    setImagePreview(null);
    setFormData((prev) => ({ ...prev, image_url: '' }));
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openCreateModal = () => {
    setEditingProductId(null);
    setFormData({ ...EMPTY_FORM });
    clearImage();
    setModalOpen(true);
  };

  const openEditModal = (product: Product) => {
    setEditingProductId(product.id);
    setFormData({
      name: product.name,
      category: product.category,
      subcategory: product.subcategory,
      brand: product.brand,
      fragrance: product.fragrance,
      pack_size: product.pack_size,
      form: product.form,
      usage: product.usage,
      price: String(product.price),
      stock: String(product.stock),
      sku: product.sku,
      status: product.status,
      image_url: product.image_url || '',
    });
    setImageFile(null);
    setImagePreview(proxyImageUrl(product.image_url) || null);
    setModalOpen(true);
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingProductId(null);
    setFormData({ ...EMPTY_FORM });
    clearImage();
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const payload = new FormData();
    payload.append('name', formData.name);
    payload.append('category', formData.category);

    if (formData.subcategory) payload.append('subcategory', formData.subcategory);
    if (formData.brand) payload.append('brand', formData.brand);
    if (formData.fragrance) payload.append('fragrance', formData.fragrance);
    if (formData.pack_size) payload.append('pack_size', formData.pack_size);
    if (formData.form) payload.append('form', formData.form);
    if (formData.usage) payload.append('usage', formData.usage);
    if (formData.price) payload.append('price', String(Number(formData.price)));
    if (formData.stock) payload.append('stock', String(Number(formData.stock)));
    if (formData.sku) payload.append('sku', formData.sku);
    if (formData.status) payload.append('status', formData.status);
    if (imageFile) payload.append('image', imageFile);

    try {
      const response = await fetch(editingProductId ? `/api/admin/products/${editingProductId}` : '/api/admin/products', {
        method: editingProductId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          ...(getAuthHeaders() || {}),
        },
        body: payload,
      });

      const result = (await response.json()) as ApiErrorPayload;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(result, 'Unable to save product.'));
      }

      closeModal();
      await fetchProducts();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to save product.');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (productId: string) => {
    const shouldDelete = window.confirm('Delete this product?');
    if (!shouldDelete) return;

    try {
      const response = await fetch(`/api/admin/products/${productId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      const result = (await response.json()) as ApiErrorPayload;

      if (!response.ok) {
        throw new Error(getApiErrorMessage(result, 'Unable to delete product.'));
      }

      await fetchProducts();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to delete product.');
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
          {/* Topbar */}
          <header className="admin-topbar">
            <div className="admin-search-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input type="text" placeholder="Search products, orders, customers..." aria-label="Search" />
            </div>
            <div className="admin-user-pill">
              <span>{initials || 'AD'}</span>
              <div><strong>{displayName}</strong><small>Admin</small></div>
            </div>
          </header>

          {/* Page heading */}
          <div className="admin-page-heading">
            <div>
              <p className="admin-overline">Catalog</p>
              <h1 className="admin-page-title">Products</h1>
            </div>
            <button type="button" className="admin-primary-button" onClick={openCreateModal}>
              + Upload product
            </button>
          </div>

          {fetchError ? <p className="admin-products-error">{fetchError}</p> : null}

          {/* Filters */}
          <div className="admin-product-toolbar">
            <div className="admin-search-wrap admin-product-search">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="text"
                placeholder="Search products or SKU"
                aria-label="Search products"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <div className="admin-filter-tabs">
              {(['All', 'Active', 'Draft', 'Archived'] as FilterTab[]).map((tab) => (
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

          {/* Product table */}
          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Product</th>
                  <th>SKU</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loadingProducts ? (
                  <tr><td colSpan={6} className="admin-table-empty">Loading products...</td></tr>
                ) : filteredProducts.length === 0 ? (
                  <tr><td colSpan={6} className="admin-table-empty">No products found.</td></tr>
                ) : (
                  filteredProducts.map((product) => (
                    <tr key={product.id}>
                      <td>
                        <div className="admin-product-cell">
                          {product.image_url ? (
                            <img src={proxyImageUrl(product.image_url)} alt={product.name} className="admin-product-thumb" />
                          ) : (
                            <span className="admin-product-thumb" aria-hidden="true" />
                          )}
                          <div>
                            <strong>{product.name}</strong>
                            <small>{product.category} · {product.fragrance}</small>
                          </div>
                        </div>
                      </td>
                      <td>{product.sku || '—'}</td>
                      <td>{`$${product.price}`}</td>
                      <td className={product.stock < 10 ? 'admin-stock-low' : ''}>{product.stock}</td>
                      <td>
                        <span className={`admin-status-badge admin-status-${product.status.toLowerCase()}`}>
                          {product.status}
                        </span>
                      </td>
                      <td>
                        <div className="admin-row-actions">
                          <button type="button" className="admin-row-button" onClick={() => openEditModal(product)}>
                            Edit
                          </button>
                          <button type="button" className="admin-row-button danger" onClick={() => handleDelete(product.id)}>
                            Delete
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

      {/* Upload modal */}
      {modalOpen && (
        <div className="admin-modal-overlay" onClick={closeModal}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-header">
              <h2>Upload Product</h2>
              <button type="button" className="admin-modal-close" onClick={closeModal} aria-label="Close">✕</button>
            </div>

            <form className="admin-product-form" onSubmit={handleSave}>

              {/* Image upload */}
              <div className="admin-form-image-section">
                <span className="admin-form-image-label">Product Image</span>
                <div
                  className={`admin-image-dropzone${imagePreview ? ' has-image' : ''}`}
                  onClick={() => fileInputRef.current?.click()}
                  onDragOver={(e) => e.preventDefault()}
                  onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files?.[0];
                    if (file && file.type.startsWith('image/')) {
                      setImageFromFile(file);
                    }
                  }}
                >
                  {imagePreview ? (
                    <>
                      <img src={imagePreview} alt="Preview" className="admin-image-preview" />
                      <button
                        type="button"
                        className="admin-image-remove"
                        onClick={(e) => { e.stopPropagation(); clearImage(); }}
                        aria-label="Remove image"
                      >
                        ✕
                      </button>
                    </>
                  ) : (
                    <div className="admin-image-placeholder">
                      <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                        <rect x="3" y="3" width="18" height="18" rx="2" />
                        <circle cx="8.5" cy="8.5" r="1.5" />
                        <polyline points="21 15 16 10 5 21" />
                      </svg>
                      <p>Click or drag &amp; drop to upload</p>
                      <small>PNG, JPG, WEBP — max 5 MB</small>
                    </div>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    className="admin-image-input"
                    onChange={handleImageChange}
                    aria-label="Upload product image"
                  />
                </div>
              </div>

              <div className="admin-form-grid">
                <label className="admin-form-field admin-form-full">
                  <span>Product Name</span>
                  <input name="name" placeholder="e.g. Ocean Breeze Car Air Freshener" value={formData.name} onChange={handleField} required />
                </label>

                <label className="admin-form-field">
                  <span>Category</span>
                  <input name="category" placeholder="e.g. Air Fresheners" value={formData.category} onChange={handleField} required />
                </label>

                <label className="admin-form-field">
                  <span>Subcategory</span>
                  <input name="subcategory" placeholder="e.g. Car Air Freshener" value={formData.subcategory} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Brand</span>
                  <input name="brand" placeholder="e.g. Divine Reesha" value={formData.brand} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Fragrance</span>
                  <input name="fragrance" placeholder="e.g. Ocean Breeze" value={formData.fragrance} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Pack Size</span>
                  <input name="pack_size" placeholder="e.g. 250 ml" value={formData.pack_size} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Form</span>
                  <input name="form" placeholder="e.g. Liquid" value={formData.form} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Usage</span>
                  <input name="usage" placeholder="e.g. Car" value={formData.usage} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Price ($)</span>
                  <input name="price" type="number" min="0" placeholder="0.00" value={formData.price} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Stock</span>
                  <input name="stock" type="number" min="0" placeholder="0" value={formData.stock} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>SKU</span>
                  <input name="sku" placeholder="e.g. DR-OCB-01" value={formData.sku} onChange={handleField} />
                </label>

                <label className="admin-form-field">
                  <span>Status</span>
                  <select name="status" value={formData.status} onChange={handleField}>
                    <option value="Active">Active</option>
                    <option value="Draft">Draft</option>
                    <option value="Archived">Archived</option>
                  </select>
                </label>

                <label className="admin-form-field admin-form-full">
                  <span>Image URL (optional)</span>
                  <input
                    name="image_url"
                    placeholder="https://example.com/product.jpg"
                    value={formData.image_url}
                    onChange={handleField}
                  />
                </label>
              </div>

              <div className="admin-modal-footer">
                <button type="button" className="admin-ghost-button" onClick={closeModal}>Cancel</button>
                <button type="submit" className="admin-primary-button" disabled={saving}>
                  {saving ? 'Saving…' : editingProductId ? 'Update product' : 'Save product'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </section>
  );
}
