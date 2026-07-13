'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function AdminSidebar({
  displayName,
  initials,
  onLogout,
}: {
  displayName: string;
  initials: string;
  onLogout: () => void;
}) {
  const pathname = usePathname();

  const navItems = [
    { label: 'Overview', href: '/admin/dashboard' },
    { label: 'Products', href: '/admin/products' },
    { label: 'Orders', href: '/admin/orders' },
    { label: 'Tracking', href: '/admin/tracking' },
  ];

  return (
    <aside className="admin-sidebar">
      <div className="admin-brand">
        <h2>Reesha.</h2>
        <p>Admin Studio</p>
      </div>

      <nav className="admin-nav">
        {navItems.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className={`admin-nav-item${pathname === item.href ? ' active' : ''}`}
          >
            {item.label}
          </Link>
        ))}
      </nav>

      <div className="admin-help-card">
        <h3>Need help?</h3>
        <p>Read the merchant handbook to master your storefront.</p>
        <button type="button">Open guide</button>
      </div>
    </aside>
  );
}
