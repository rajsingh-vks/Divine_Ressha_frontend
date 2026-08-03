import { footerGroups, footerBottom } from '@/lib/data/footer';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        {footerGroups.map((group) => (
          <div key={group.heading} className="footer-group">
            <p className="footer-heading">{group.heading}</p>
            {group.links.map((link) => (
              <a
                key={`${group.heading}-${link.label}`}
                href={link.href}
                target={link.href.startsWith('http') ? '_blank' : undefined}
                rel={link.href.startsWith('http') ? 'noreferrer noopener' : undefined}
                className="footer-link-inline"
              >
                {group.heading === 'FOLLOW' && link.label === 'INSTAGRAM' ? (
                  <span className="footer-social-icon" aria-hidden="true">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="12" cy="12" r="4.1" stroke="currentColor" strokeWidth="1.8" />
                      <circle cx="17.3" cy="6.7" r="1.2" fill="currentColor" />
                    </svg>
                  </span>
                ) : null}
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>{footerBottom.copyright}</p>
        <p>{footerBottom.tagline}</p>
        <p>{footerBottom.supportEmail}</p>
      </div>
    </footer>
  );
}
