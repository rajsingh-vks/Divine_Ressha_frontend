'use client';

import Image from 'next/image';
import { navigationLinks, brandName, headerText } from '@/lib/data/navigation';

export default function Header() {
  return (
    <header className="site-header">
      <nav className="site-nav">
        {navigationLinks.map((link) => (
          <a key={link.href} href={link.href}>
            {link.label}
          </a>
        ))}
      </nav>
      <div className="brand">
        <Image 
          src="/images/logo.png" 
          alt={brandName} 
          width={80} 
          height={50}
          className="brand-logo"
          priority
        />
        {/* <span>{brandName}</span> */}
      </div>
      <div className="header-actions">
        <button className="icon-button" aria-label={headerText.searchLabel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </button>
        <button className="icon-button bag-button" aria-label={headerText.bagLabel}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 2L6 6H3V22H21V6H18V2M6 2H18V6M9 11V17M15 11V17M12 11V17"></path>
          </svg>
          <span className="bag-count">0</span>
        </button>
      </div>
    </header>
  );
}
