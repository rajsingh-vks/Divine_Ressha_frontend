'use client';

import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';
import type { Product } from '@/lib/data/products';

type ShopActionsContextValue = {
  cartCount: number;
  wishlistCount: number;
  addToCart: (product: Product) => Promise<void>;
  toggleWishlist: (product: Product) => Promise<void>;
  isInCart: (productId: string) => boolean;
  isWishlisted: (productId: string) => boolean;
};

type ShopItem = {
  id?: string;
  productId?: string;
  product_id?: string;
  title?: string;
  name?: string;
  price?: number;
};

type BackendCollection = {
  items?: ShopItem[];
  data?: ShopItem[];
  cart?: ShopItem[];
  wishlist?: ShopItem[];
} | ShopItem[];

const GUEST_CART_KEY = 'divine_ressha_guest_cart';
const GUEST_WISHLIST_KEY = 'divine_ressha_guest_wishlist';

const ShopActionsContext = createContext<ShopActionsContextValue | undefined>(undefined);

const readToken = () => {
  if (typeof window === 'undefined') return '';

  const token = localStorage.getItem(AUTH_TOKEN_KEY) || '';
  if (token === 'authenticated') {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    return '';
  }

  return token;
};

const hasSession = () => (typeof window !== 'undefined' && localStorage.getItem(AUTH_SESSION_KEY) === '1');

const extractErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string; error?: string };
    return payload.detail || payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
};

const isAuthenticated = () => Boolean(readToken()) || hasSession();

const readGuestItems = (key: string) => {
  if (typeof window === 'undefined') return [] as ShopItem[];

  const raw = localStorage.getItem(key);
  if (!raw) return [];

  try {
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed as ShopItem[];
  } catch {
    return [];
  }
};

const writeGuestItems = (key: string, items: ShopItem[]) => {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(items));
};

const clearGuestItems = () => {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(GUEST_CART_KEY);
  localStorage.removeItem(GUEST_WISHLIST_KEY);
};

const getItemProductId = (item: ShopItem) => String(item.productId ?? item.product_id ?? item.id ?? '');

const normalizeGuestProductPayload = (item: ShopItem) => {
  const productId = getItemProductId(item);

  return {
    id: productId,
    productId,
    product_id: productId,
    title: item.title || item.name || '',
    name: item.name || item.title || '',
    price: item.price,
  };
};

const normalizeItems = (payload: BackendCollection | null | undefined): ShopItem[] => {
  if (!payload) return [];
  if (Array.isArray(payload)) return payload;
  return payload.items || payload.data || payload.cart || payload.wishlist || [];
};

export function ShopActionsProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<ShopItem[]>([]);
  const [wishlistItems, setWishlistItems] = useState<ShopItem[]>([]);

  const syncGuestToBackend = async (guestCart: ShopItem[], guestWishlist: ShopItem[]) => {
    if (!isAuthenticated()) return;

    const token = readToken();
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    };

    await Promise.all(
      guestCart
        .filter((item) => getItemProductId(item))
        .map((item) =>
          fetch('/api/cart', {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify(normalizeGuestProductPayload(item)),
          }).catch(() => null)
        )
    );

    await Promise.all(
      guestWishlist
        .filter((item) => getItemProductId(item))
        .map((item) =>
          fetch('/api/wishlist', {
            method: 'POST',
            credentials: 'include',
            headers,
            body: JSON.stringify(normalizeGuestProductPayload(item)),
          }).catch(() => null)
        )
    );
  };

  const fetchCollection = async (path: '/api/cart' | '/api/wishlist') => {
    const token = readToken();
    const response = await fetch(path, {
      credentials: 'include',
      headers: token
        ? {
            Authorization: `Bearer ${token}`,
          }
        : undefined,
      cache: 'no-store',
    });

    if (response.status === 401) {
      // Keep auth state intact here. Cart/wishlist can be unauthorized independently,
      // and clearing auth on these endpoints can force users back to login after a successful sign-in.
      return [];
    }

    if (!response.ok) return [];

    const payload = (await response.json()) as BackendCollection;
    return normalizeItems(payload);
  };

  useEffect(() => {
    let mounted = true;

    const hydrate = async () => {
      if (!isAuthenticated()) {
        setCartItems(readGuestItems(GUEST_CART_KEY));
        setWishlistItems(readGuestItems(GUEST_WISHLIST_KEY));
        return;
      }

      const guestCart = readGuestItems(GUEST_CART_KEY);
      const guestWishlist = readGuestItems(GUEST_WISHLIST_KEY);

      if (!mounted) return;
      if (guestCart.length) setCartItems(guestCart);
      if (guestWishlist.length) setWishlistItems(guestWishlist);

      if (guestCart.length || guestWishlist.length) {
        await syncGuestToBackend(guestCart, guestWishlist);
      }

      const [cart, wishlist] = await Promise.all([fetchCollection('/api/cart'), fetchCollection('/api/wishlist')]);
      if (!mounted) return;
      setCartItems(cart.length ? cart : guestCart);
      setWishlistItems(wishlist.length ? wishlist : guestWishlist);

      if (cart.length || wishlist.length) {
        clearGuestItems();
      }
    };

    hydrate();

    const sync = () => hydrate();
    window.addEventListener('auth-change', sync);

    return () => {
      mounted = false;
      window.removeEventListener('auth-change', sync);
    };
  }, []);

  const addToCart = async (product: Product) => {
    if (!isAuthenticated()) {
      setCartItems((current) => {
        const exists = current.some((item) => item.productId === product.id || item.id === product.id || item.title === product.title);
        const next = exists ? current : [...current, { id: product.id, title: product.title, price: product.price }];
        writeGuestItems(GUEST_CART_KEY, next);
        return next;
      });
      return;
    }

    const token = readToken();
    const response = await fetch('/api/cart', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please login to add items to cart.');
      }
      const message = await extractErrorMessage(response, 'Unable to add to cart.');
      throw new Error(message);
    }

    const payload = (await response.json()) as BackendCollection;
    const normalized = normalizeItems(payload);
    setCartItems((current) => (normalized.length ? normalized : [...current, { id: product.id, title: product.title }]));
  };

  const toggleWishlist = async (product: Product) => {
    if (!isAuthenticated()) {
      setWishlistItems((current) => {
        const exists = current.some((item) => item.productId === product.id || item.id === product.id || item.title === product.title);
        const next = exists
          ? current.filter((item) => !(item.productId === product.id || item.id === product.id || item.title === product.title))
          : [...current, { id: product.id, title: product.title, price: product.price }];

        writeGuestItems(GUEST_WISHLIST_KEY, next);
        return next;
      });
      return;
    }

    const token = readToken();
    const exists = wishlistItems.some((item) => item.productId === product.id || item.id === product.id || item.title === product.title);

    const response = await fetch('/api/wishlist', {
      method: exists ? 'DELETE' : 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify(product),
    });

    if (!response.ok) {
      if (response.status === 401) {
        throw new Error('Please login to update wishlist.');
      }
      const message = await extractErrorMessage(response, 'Unable to update wishlist.');
      throw new Error(message);
    }

    if (exists) {
      setWishlistItems((current) => current.filter((item) => !(item.productId === product.id || item.id === product.id || item.title === product.title)));
      return;
    }

    const payload = (await response.json()) as BackendCollection;
    const normalized = normalizeItems(payload);
    setWishlistItems((current) => (normalized.length ? normalized : [...current, { id: product.id, title: product.title }]));
  };

  const value = useMemo<ShopActionsContextValue>(
    () => ({
      cartCount: cartItems.length,
      wishlistCount: wishlistItems.length,
      addToCart,
      toggleWishlist,
      isInCart: (productId) => cartItems.some((item) => item.productId === productId || item.id === productId),
      isWishlisted: (productId) => wishlistItems.some((item) => item.productId === productId || item.id === productId),
    }),
    [cartItems, wishlistItems]
  );

  return <ShopActionsContext.Provider value={value}>{children}</ShopActionsContext.Provider>;
}

export function useShopActions() {
  const context = useContext(ShopActionsContext);
  if (!context) {
    throw new Error('useShopActions must be used within ShopActionsProvider');
  }

  return context;
}
