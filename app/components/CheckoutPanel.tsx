'use client';

import Link from 'next/link';
import Script from 'next/script';
import { useRouter } from 'next/navigation';
import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY } from '@/lib/constants/auth';
import { useShopActions } from './ShopActionsProvider';
import { proxyImageUrl } from '@/lib/utils/imageProxy';

type ShopItem = {
  id?: string;
  productId?: string;
  product_id?: string;
  quantity?: number;
  line_total?: number;
  unit_price?: number;
  product?: {
    id?: string;
    name?: string;
    title?: string;
    image_url?: string;
    price?: number;
    category?: string;
  };
  title?: string;
  name?: string;
  price?: number;
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

type OrderResponse = {
  id: string;
  order_number: string;
  status: string;
};

type ConfirmationResponse = {
  success?: boolean;
  message?: string;
};

type RazorpayOrderResponse = {
  order_id: string;
  amount: number;
  currency: string;
  receipt?: string;
};

type RazorpaySuccessPayload = {
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
};

type PaymentConfirmationPayload = {
  payment_status: 'paid';
  payment_provider: 'razorpay';
  razorpay_payment_id: string;
  razorpay_order_id: string;
  razorpay_signature: string;
  paid_at: string;
  note: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: {
      key: string;
      amount: number;
      currency: string;
      name: string;
      description?: string;
      order_id: string;
      prefill?: {
        name?: string;
        contact?: string;
      };
      notes?: Record<string, string>;
      theme?: {
        color?: string;
      };
      modal?: {
        ondismiss?: () => void;
      };
      handler: (response: RazorpaySuccessPayload) => void | Promise<void>;
    }) => {
      open: () => void;
      on: (eventName: 'payment.failed', callback: (response: { error?: { description?: string } }) => void) => void;
    };
  }
}

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
  is_default: true,
};

const readToken = () => (typeof window === 'undefined' ? '' : localStorage.getItem(AUTH_TOKEN_KEY) || '');
const hasSession = () => typeof window !== 'undefined' && localStorage.getItem(AUTH_SESSION_KEY) === '1';
const isAuthenticated = () => Boolean(readToken()) || hasSession();

const getAuthHeaders = () => {
  const token = readToken();
  return token ? { Authorization: `Bearer ${token}` } : undefined;
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string | Array<{ msg?: string }>; message?: string; error?: string };
    if (Array.isArray(payload.detail)) {
      return payload.detail[0]?.msg || fallback;
    }
    if (typeof payload.detail === 'string') return payload.detail;
    return payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
};

const getProductId = (item: ShopItem) => String(item.product?.id ?? item.productId ?? item.product_id ?? item.id ?? '');
const getItemName = (item: ShopItem) => item.product?.name || item.product?.title || item.title || item.name || 'Product item';
const getItemImage = (item: ShopItem) => proxyImageUrl(item.product?.image_url, '/images/banner.jpg');
const getUnitPrice = (item: ShopItem) => Number(item.unit_price ?? item.product?.price ?? item.price ?? 0);
const getLineTotal = (item: ShopItem) => (typeof item.line_total === 'number' ? item.line_total : getUnitPrice(item) * (item.quantity ?? 1));
const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const buildAddressLabel = (address: Address) =>
  [address.line1, address.line2, `${address.city}, ${address.state} ${address.postal_code}`, address.country]
    .filter(Boolean)
    .join(', ');

const initialRazorpayKeyId = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || '';

export default function CheckoutPanel() {
  const router = useRouter();
  const { cartItems, refreshCart } = useShopActions();
  const [ready, setReady] = useState(false);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState('');
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [addressForm, setAddressForm] = useState<AddressFormState>({ ...EMPTY_ADDRESS_FORM });
  const [notes, setNotes] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);
  const [settingDefaultId, setSettingDefaultId] = useState('');
  const [deletingId, setDeletingId] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [redirectingAfterPayment, setRedirectingAfterPayment] = useState(false);
  const [resolvedRazorpayKeyId, setResolvedRazorpayKeyId] = useState(initialRazorpayKeyId);

  const rows = useMemo(
    () =>
      cartItems.map((item, index) => ({
        key: `${getProductId(item)}-${index}`,
        name: getItemName(item),
        image: getItemImage(item),
        quantity: item.quantity ?? 1,
        unitPrice: getUnitPrice(item),
        lineTotal: getLineTotal(item),
      })),
    [cartItems]
  );

  const subtotal = useMemo(() => rows.reduce((sum, row) => sum + row.lineTotal, 0), [rows]);
  const selectedAddress = addresses.find((address) => address.id === selectedAddressId) || null;

  const loadAddresses = async () => {
    setLoadingAddresses(true);
    setError('');

    try {
      const response = await fetch('/api/addresses', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to load addresses.'));
      }

      const payload = (await response.json()) as Address[] | { items?: Address[]; data?: Address[] };
      const nextAddresses = Array.isArray(payload) ? payload : payload.items || payload.data || [];
      setAddresses(nextAddresses);

      const preferred = nextAddresses.find((address) => address.is_default) || nextAddresses[0] || null;
      setSelectedAddressId(preferred?.id || '');
      setShowAddressForm(!nextAddresses.length);
      setAddressForm({ ...EMPTY_ADDRESS_FORM, is_default: nextAddresses.length === 0 });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load addresses.');
    } finally {
      setLoadingAddresses(false);
      setReady(true);
    }
  };

  useEffect(() => {
    if (!isAuthenticated()) {
      router.replace('/login');
      return;
    }

    void loadAddresses();
  }, [router]);

  const handleAddressField = (
    event: ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = event.target;
    const checked = 'checked' in event.target ? event.target.checked : false;
    setAddressForm((current) => ({
      ...current,
      [name]: event.target instanceof HTMLInputElement && event.target.type === 'checkbox' ? checked : value,
    }));
  };

  const resetAddressForm = () => {
    setEditingAddressId(null);
    setAddressForm({ ...EMPTY_ADDRESS_FORM, is_default: addresses.length === 0 });
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
  };

  const handleSaveAddress = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSavingAddress(true);
    setError('');
    setSuccess('');

    const payload = {
      ...addressForm,
      line2: addressForm.line2 || null,
      is_default: addressForm.is_default || addresses.length === 0,
    };

    try {
      const response = await fetch(editingAddressId ? `/api/addresses/${editingAddressId}` : '/api/addresses', {
        method: editingAddressId ? 'PUT' : 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() || {}),
        },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to save address.'));
      }

      const savedAddress = (await response.json()) as Address;
      await loadAddresses();
      setSelectedAddressId(savedAddress.id || selectedAddressId);
      setSuccess(editingAddressId ? 'Address updated.' : 'Address saved.');
      resetAddressForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save address.');
    } finally {
      setSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (addressId: string) => {
    if (!window.confirm('Delete this address?')) return;

    setDeletingId(addressId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/addresses/${addressId}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to delete address.'));
      }

      await loadAddresses();
      setSuccess('Address deleted.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to delete address.');
    } finally {
      setDeletingId('');
    }
  };

  const handleSetDefault = async (addressId: string) => {
    setSettingDefaultId(addressId);
    setError('');
    setSuccess('');

    try {
      const response = await fetch(`/api/addresses/${addressId}/default`, {
        method: 'PATCH',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to set default address.'));
      }

      await loadAddresses();
      setSelectedAddressId(addressId);
      setSuccess('Default address updated.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to set default address.');
    } finally {
      setSettingDefaultId('');
    }
  };

  const finalizeOrder = async () => {
    const response = await fetch('/api/orders', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(getAuthHeaders() || {}),
      },
      body: JSON.stringify({
        address_id: selectedAddressId,
        notes: notes.trim() || null,
      }),
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'Unable to place order.'));
    }

    return (await response.json()) as OrderResponse;
  };

  const sendOrderConfirmation = async (orderId: string, paymentPayload: PaymentConfirmationPayload) => {
    const endpoints = [`/api/orders/${orderId}/confirm`, `/api/orders/${orderId}/send-confirmation`];
    let confirmed = false;
    let notificationSent = false;

    for (const endpoint of endpoints) {
      const response = await fetch(endpoint, {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          ...(getAuthHeaders() || {}),
        },
        body: JSON.stringify(paymentPayload),
      });

      if (response.ok) {
        const payload = (await response.json().catch(() => ({}))) as ConfirmationResponse;
        if (endpoint.endsWith('/confirm')) {
          confirmed = payload.success !== false;
        } else {
          notificationSent = payload.success !== false;
        }
        continue;
      }

      if (response.status === 404 || response.status === 405) {
        continue;
      }
    }

    return { confirmed, notificationSent };
  };

  const resolveRazorpayKeyId = async () => {
    if (resolvedRazorpayKeyId) return resolvedRazorpayKeyId;

    const response = await fetch('/api/razorpay-key', {
      method: 'GET',
      cache: 'no-store',
    });

    if (!response.ok) {
      throw new Error(await getApiErrorMessage(response, 'Razorpay key is missing on server environment.'));
    }

    const payload = (await response.json()) as { key_id?: string };
    const keyId = payload.key_id?.trim() || '';

    if (!keyId) {
      throw new Error('Razorpay key is missing on server environment.');
    }

    setResolvedRazorpayKeyId(keyId);
    return keyId;
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddressId) {
      setError('Please select or add a delivery address.');
      return;
    }

    if (!window.Razorpay) {
      setError('Payment gateway is still loading. Please try again in a moment.');
      return;
    }

    const amountInPaise = Math.round(subtotal * 100);
    if (!Number.isFinite(amountInPaise) || amountInPaise < 100) {
      setError('Order amount must be at least ₹1.');
      return;
    }

    setPlacingOrder(true);
    setRedirectingAfterPayment(false);
    setError('');
    setSuccess('');

    try {
      const razorpayKeyId = await resolveRazorpayKeyId();

      const response = await fetch('/api/create-order', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: amountInPaise,
          currency: 'INR',
          receipt: `divine_ressha_${Date.now()}`,
        }),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to create Razorpay order.'));
      }

      const razorpayOrder = (await response.json()) as RazorpayOrderResponse;
      let paymentSettled = false;

      const razorpay = new window.Razorpay({
        key: razorpayKeyId,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        name: 'Divine Ressha',
        description: 'Secure checkout payment',
        order_id: razorpayOrder.order_id,
        prefill: {
          name: selectedAddress?.full_name || '',
          contact: selectedAddress?.phone || '',
        },
        notes: {
          address_id: selectedAddressId,
          order_note: notes.trim() || '',
        },
        theme: {
          color: '#2874f0',
        },
        modal: {
          ondismiss: () => {
            if (paymentSettled) return;
            setPlacingOrder(false);
            setRedirectingAfterPayment(false);
            setError('Payment was cancelled before completion.');
          },
        },
        handler: async (paymentResponse) => {
          paymentSettled = true;
          setRedirectingAfterPayment(true);

          try {
            const verifyResponse = await fetch('/api/verify-payment', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
              },
              body: JSON.stringify(paymentResponse),
            });

            if (!verifyResponse.ok) {
              throw new Error(await getApiErrorMessage(verifyResponse, 'Unable to verify payment.'));
            }

            const order = await finalizeOrder();
            const paymentPayload: PaymentConfirmationPayload = {
              payment_status: 'paid',
              payment_provider: 'razorpay',
              razorpay_payment_id: paymentResponse.razorpay_payment_id,
              razorpay_order_id: paymentResponse.razorpay_order_id,
              razorpay_signature: paymentResponse.razorpay_signature,
              paid_at: new Date().toISOString(),
              note: 'Payment verified from Razorpay checkout. Syncing paid metadata on order.',
            };
            const confirmationResult = await sendOrderConfirmation(order.id, paymentPayload).catch(() => ({ confirmed: false, notificationSent: false }));
            await refreshCart();
            router.push(
              `/profile/order?placed=${encodeURIComponent(order.id)}&order=${encodeURIComponent(order.order_number)}&status=${encodeURIComponent(order.status)}&confirmation=${confirmationResult.notificationSent ? 'sent' : 'failed'}&payment=${confirmationResult.confirmed ? 'paid' : 'pending'}`
            );
          } catch (err) {
            setRedirectingAfterPayment(false);
            setError(err instanceof Error ? err.message : 'Payment succeeded but order placement failed.');
          } finally {
            setPlacingOrder(false);
          }
        },
      });

      razorpay.on('payment.failed', (paymentFailure) => {
        paymentSettled = true;
        setPlacingOrder(false);
        setRedirectingAfterPayment(false);
        setError(paymentFailure.error?.description || 'Payment failed. Please try again.');
      });

      razorpay.open();
    } catch (err) {
      setPlacingOrder(false);
      setRedirectingAfterPayment(false);
      setError(err instanceof Error ? err.message : 'Unable to start payment.');
    }
  };

  if (!ready) {
    return (
      <section className="checkout-shell">
        <div className="checkout-card"><p>Preparing checkout...</p></div>
      </section>
    );
  }

  if (!rows.length) {
    return (
      <section className="checkout-shell">
        <div className="checkout-card checkout-empty-state">
          <h1>Your cart is empty</h1>
          <p>Add products before placing an order.</p>
          <Link href="/cart" className="checkout-primary-button">Return to cart</Link>
        </div>
      </section>
    );
  }

  return (
    <>
      <Script id="razorpay-checkout-js" src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />
      {redirectingAfterPayment ? (
        <div className="checkout-payment-loader" role="status" aria-live="polite" aria-label="Payment successful, redirecting to order page">
          <div className="checkout-payment-loader__spinner" />
          <p>Payment successful. Redirecting to your order page...</p>
        </div>
      ) : null}
      <section className="checkout-shell">
        <div className="checkout-layout">
        <div className="checkout-main-card">
          <div className="checkout-heading">
            <div>
              <p className="checkout-overline">Checkout</p>
              <h1>Select address and place order</h1>
            </div>
            <Link href="/cart" className="checkout-link-button" aria-label="Back to cart">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M3 3h2l.4 2M7 13h10l4-8H5.4" />
                <circle cx="9" cy="19" r="1" />
                <circle cx="17" cy="19" r="1" />
              </svg>
              <span>Back to cart</span>
            </Link>
          </div>

          {error ? <p className="checkout-message error">{error}</p> : null}
          {success ? <p className="checkout-message success">{success}</p> : null}

          <section className="checkout-section">
            <div className="checkout-section-head">
              <div>
                <h2>Delivery address</h2>
                <p>Existing account address stays selected as default for this order.</p>
              </div>
              {!showAddressForm ? (
                <button type="button" className="checkout-link-button" onClick={() => setShowAddressForm(true)}>
                  + Add address
                </button>
              ) : null}
            </div>

            {loadingAddresses ? <p className="checkout-muted">Loading addresses...</p> : null}

            {addresses.length ? (
              <div className="address-list-grid">
                {addresses.map((address) => {
                  const active = selectedAddressId === address.id;
                  return (
                    <article key={address.id} className={`address-card${active ? ' active' : ''}`}>
                      <label className="address-select-row">
                        <input
                          type="radio"
                          name="selectedAddress"
                          value={address.id}
                          checked={active}
                          onChange={() => setSelectedAddressId(address.id)}
                        />
                        <div>
                          <div className="address-title-row">
                            <strong>{address.full_name}</strong>
                            {address.is_default ? <span className="address-badge">Default</span> : null}
                          </div>
                          <p>{buildAddressLabel(address)}</p>
                          <small>{address.phone} · {address.address_type}</small>
                        </div>
                      </label>

                      <div className="address-card-actions">
                        {!address.is_default ? (
                          <button type="button" onClick={() => handleSetDefault(address.id)} disabled={settingDefaultId === address.id}>
                            {settingDefaultId === address.id ? 'Saving…' : 'Set default'}
                          </button>
                        ) : null}
                        <button type="button" onClick={() => handleEditAddress(address)}>Edit</button>
                        <button type="button" className="danger" onClick={() => handleDeleteAddress(address.id)} disabled={deletingId === address.id}>
                          {deletingId === address.id ? 'Deleting…' : 'Delete'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            ) : !showAddressForm && !loadingAddresses ? (
              <p className="checkout-muted">No address saved yet. Add your first address to continue.</p>
            ) : null}

            {showAddressForm ? (
              <form className="checkout-address-form" onSubmit={handleSaveAddress}>
                <div className="checkout-form-grid">
                  <label>
                    <span>Full name</span>
                    <input name="full_name" value={addressForm.full_name} onChange={handleAddressField} required />
                  </label>
                  <label>
                    <span>Phone</span>
                    <input name="phone" value={addressForm.phone} onChange={handleAddressField} required />
                  </label>
                  <label className="full">
                    <span>Address line 1</span>
                    <input name="line1" value={addressForm.line1} onChange={handleAddressField} required />
                  </label>
                  <label className="full">
                    <span>Address line 2</span>
                    <input name="line2" value={addressForm.line2} onChange={handleAddressField} />
                  </label>
                  <label>
                    <span>City</span>
                    <input name="city" value={addressForm.city} onChange={handleAddressField} required />
                  </label>
                  <label>
                    <span>State</span>
                    <input name="state" value={addressForm.state} onChange={handleAddressField} required />
                  </label>
                  <label>
                    <span>Postal code</span>
                    <input name="postal_code" value={addressForm.postal_code} onChange={handleAddressField} required />
                  </label>
                  <label>
                    <span>Country</span>
                    <input name="country" value={addressForm.country} onChange={handleAddressField} required />
                  </label>
                  <label>
                    <span>Address type</span>
                    <select name="address_type" value={addressForm.address_type} onChange={handleAddressField}>
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="other">Other</option>
                    </select>
                  </label>
                  <label className="checkout-checkbox-row">
                    <input type="checkbox" name="is_default" checked={addressForm.is_default} onChange={handleAddressField} />
                    <span>Set as default address</span>
                  </label>
                </div>

                <div className="checkout-form-actions">
                  <button type="submit" className="checkout-primary-button" disabled={savingAddress}>
                    {savingAddress ? 'Saving…' : editingAddressId ? 'Update address' : 'Save address'}
                  </button>
                  <button type="button" className="checkout-secondary-button" onClick={resetAddressForm}>
                    Cancel
                  </button>
                </div>
              </form>
            ) : null}
          </section>

          <section className="checkout-section">
            <h2>Order note</h2>
            <textarea
              className="checkout-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Add delivery notes for this order"
              rows={4}
            />
          </section>
        </div>

        <aside className="checkout-summary-card">
          <h2>Order summary</h2>
          <ul className="checkout-order-list">
            {rows.map((row) => (
              <li key={row.key} className="checkout-order-item">
                <img src={row.image} alt={row.name} className="checkout-order-thumb" />
                <div>
                  <strong>{row.name}</strong>
                  <small>Qty {row.quantity} × {formatCurrency(row.unitPrice)}</small>
                </div>
                <span>{formatCurrency(row.lineTotal)}</span>
              </li>
            ))}
          </ul>

          <div className="checkout-summary-lines">
            <div><span>Subtotal</span><strong>{formatCurrency(subtotal)}</strong></div>
            <div><span>Shipping</span><strong>Free</strong></div>
            <div className="total"><span>Total</span><strong>{formatCurrency(subtotal)}</strong></div>
          </div>

          <div className="checkout-selected-address">
            <h3>Delivering to</h3>
            {selectedAddress ? (
              <>
                <strong>{selectedAddress.full_name}</strong>
                <p>{buildAddressLabel(selectedAddress)}</p>
                <small>{selectedAddress.phone}</small>
              </>
            ) : (
              <p className="checkout-muted">Select an address to continue.</p>
            )}
          </div>

          <button type="button" className="checkout-primary-button checkout-place-button" onClick={handlePlaceOrder} disabled={placingOrder || !selectedAddressId || !rows.length}>
            {placingOrder ? 'Processing payment…' : 'Pay & place order'}
          </button>
        </aside>
        </div>
      </section>
    </>
  );
}
