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
      { label: 'BODY WASH', href: '#shop' },
      { label: 'SOAP BARS', href: '#shop' },
      { label: 'GIFT SETS', href: '#shop' },
    ],
  },
  {
    heading: 'ABOUT',
    links: [
      { label: 'OUR STORY', href: '/about' },
      { label: 'INGREDIENTS', href: '#ritual' },
      { label: 'SUSTAINABILITY', href: '#ritual' },
    ],
  },
  {
    heading: 'SUPPORT',
    links: [
      { label: 'SHIPPING', href: '#' },
      { label: 'RETURNS', href: '#' },
      { label: 'CONTACT', href: '/contact' },
      { label: 'PRIVACY POLICY', href: '/privacy-policy' },
      { label: 'TERMS & CONDITIONS', href: '/terms-conditions' },
    ],
  },
  {
    heading: 'FOLLOW',
    links: [
      { label: 'INSTAGRAM', href: 'https://www.instagram.com/divineressha?igsh=MWdkaXYyMHcwb2p6cA==' },
      { label: 'PINTEREST', href: '#' },
    ],
  },
];

export const footerBottom = {
  copyright: '© 2026 DIVINE RESSHA. ALL RIGHTS RESERVED.',
  tagline: 'FORMULATED WITH CARE · MADE IN SMALL BATCHES',
  supportEmail: 'support@divineressha.com',
};
