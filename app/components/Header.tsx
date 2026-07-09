'use client';

import Image from 'next/image';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { navigationLinks, brandName, headerText } from '@/lib/data/navigation';
import Link from 'next/link';
import { AUTH_TOKEN_KEY, AUTH_USER_KEY } from '@/lib/constants/auth';

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [profileName, setProfileName] = useState('Profile');
  const router = useRouter();

  useEffect(() => {
    const syncAuthState = () => {
      const token = localStorage.getItem(AUTH_TOKEN_KEY);
      const user = localStorage.getItem(AUTH_USER_KEY);

      setIsAuthenticated(Boolean(token));

      if (user) {
        try {
          const parsed = JSON.parse(user) as { name?: string; email?: string };
          setProfileName(parsed.name || parsed.email || 'Profile');
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
      <nav className="site-nav desktop-nav">
        {navigationLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>

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
                <Link href="/login" onClick={() => setProfileOpen(false)}>
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
        {/* <button className="icon-button" aria-label={headerText.searchLabel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button> */}
        <button className="icon-button bag-button" aria-label={headerText.bagLabel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L6 6H3V22H21V6H18V2M6 2H18V6M9 11V17M15 11V17M12 11V17"></path>
          </svg>
          <span className="bag-count">0</span>
        </button>

        {/* Hamburger */}
        <button
          className="menu-btn"
          onClick={() => setMenuOpen(!menuOpen)}
          aria-label="Menu"
        >
          ☰
        </button>
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
