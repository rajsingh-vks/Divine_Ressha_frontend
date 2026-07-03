import { footerGroups, footerBottom } from '@/lib/data/footer';

export default function Footer() {
  return (
    <footer className="site-footer">
      <div className="footer-top">
        {footerGroups.map((group) => (
          <div key={group.heading} className="footer-group">
            <p className="footer-heading">{group.heading}</p>
            {group.links.map((link) => (
              <a key={link.href} href={link.href}>
                {link.label}
              </a>
            ))}
          </div>
        ))}
      </div>
      <div className="footer-bottom">
        <p>{footerBottom.copyright}</p>
        <p>{footerBottom.tagline}</p>
      </div>
    </footer>
  );
}
