'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { navigationLinks, brandName, headerText } from '@/lib/data/navigation';
import Link from 'next/link';
import { AUTH_SESSION_KEY, AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';
import { useShopActions } from './ShopActionsProvider';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileName, setProfileName] = useState('Profile');
  const { cartCount, wishlistCount } = useShopActions();
  const router = useRouter();

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const session = localStorage.getItem(AUTH_SESSION_KEY) === '1';
      const user = localStorage.getItem(AUTH_USER_KEY);

      setIsAuthenticated(Boolean(token) || session);

      if (user) {
        try {
          const parsed = JSON.parse(user) as { name?: string; full_name?: string; email?: string };
          setProfileName(parsed.name || parsed.full_name || parsed.email || 'Profile');
        } catch {
          setProfileName('Profile');
        }
      } else {
        setProfileName('Profile');
      }
    };

    syncAuthState();
    window.addEventListener('storage', syncAuthState);
    window.addEventListener('auth-change', syncAuthState);

    return () => {
      window.removeEventListener('storage', syncAuthState);
      window.removeEventListener('auth-change', syncAuthState);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem(AUTH_TOKEN_KEY);
    localStorage.removeItem(AUTH_SESSION_KEY);
    localStorage.removeItem(AUTH_USER_KEY);
    setIsAuthenticated(false);
    setProfileName('Profile');
    setProfileOpen(false);
    window.dispatchEvent(new Event('auth-change'));
    router.push('/login');
  };

  return (
    <header className="site-header">
      {/* Desktop Navigation */}
      {/* <nav className="site-nav desktop-nav">
        {navigationLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav> */}

      <div className="brand">
        <Link href="/">
          <Image
            src="/images/logo_new.png"
            alt={brandName}
            width={80}
            height={50}
            className="brand-logo"
            priority
          />
        </Link>
      </div>
      <div className="header-actions">
        <Link href="/wishlist" className="icon-button shop-count-button" aria-label={`Wishlist ${wishlistCount}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
          </svg>
          <span className="bag-count">{wishlistCount}</span>
        </Link>
        <Link href="/cart" className="icon-button shop-count-button" aria-label={`Cart ${cartCount}`}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M6 2l1.5 4h13l-1.5 8h-12L4 2z" />
            <circle cx="10" cy="20" r="1" />
            <circle cx="18" cy="20" r="1" />
          </svg>
          <span className="bag-count">{cartCount}</span>
        </Link>
        {isAuthenticated ? (
          <div className="profile-menu">
            <button
              type="button"
              className="login-button profile-trigger"
              aria-label="Profile menu"
              aria-expanded={profileOpen}
              onClick={() => setProfileOpen((current) => !current)}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M20 21a8 8 0 0 0-16 0" />
                <circle cx="12" cy="8" r="4" />
              </svg>
            </button>

            {profileOpen && (
              <div className="profile-dropdown">
                <Link href="/profile" onClick={() => setProfileOpen(false)}>
                  {profileName}
                </Link>
                <Link href="/profile/order" onClick={() => setProfileOpen(false)}>
                  My Orders
                </Link>
                <Link href="/profile" onClick={() => setProfileOpen(false)}>
                  Account
                </Link>
                <button type="button" onClick={handleLogout}>
                  Logout
                </button>
              </div>
            )}
          </div>
        ) : (
          <Link href="/login" className="login-button" aria-label="Login">
            <svg
              width="20"
              height="20"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M20 21a8 8 0 0 0-16 0" />
              <circle cx="12" cy="8" r="4" />
            </svg>
          </Link>
        )}

        {/* Hamburger */}
        {/* <button
          className="menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          ☰
        </button> */}
      </div>

      {/* Mobile Navigation */}
      <nav className={`mobile-nav ${menuOpen ? 'active' : ''}`}>
        {navigationLinks.map((link) => (
          <a
            key={link.href}
            href={link.href}
            onClick={() => setMenuOpen(false)}
          >
            {link.label}
          </a>
        ))}
      </nav>
    </header>
  );
}
