export interface FooterLink {
  label: string;
  href: string;
}

export interface FooterGroup {
  heading: string;
  links: FooterLink[];
}

export const footerGroups: FooterGroup[] = [
  {
    heading: 'SHOP',
    links: [
      { label: 'Air Frsheners', href: '/products' },
    ],
  },
  {
    heading: 'ABOUT',
    links: [
      { label: 'OUR STORY', href: '/about' }
    ],
  },
  {
    heading: 'SUPPORT',
    links: [
      { label: 'CONTACT', href: '/contact' },
      { label: 'PRIVACY POLICY', href: '/privacy-policy' },
      { label: 'TERMS & CONDITIONS', href: '/terms-conditions' },
    ],
  },
  {
    heading: 'FOLLOW',
    links: [
      { label: 'INSTAGRAM', href: 'https://www.instagram.com/divineressha?igsh=MWdkaXYyMHcwb2p6cA==' }
    ],
  },
];

export const footerBottom = {
  copyright: '© 2026 DIVINE RESSHA. ALL RIGHTS RESERVED.',
  tagline: 'FORMULATED WITH CARE · MADE IN SMALL BATCHES',
  supportEmail: 'support@divineressha.com',
};
