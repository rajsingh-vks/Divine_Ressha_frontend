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
      { label: 'OUR STORY', href: '#ritual' },
      { label: 'INGREDIENTS', href: '#ritual' },
      { label: 'SUSTAINABILITY', href: '#ritual' },
    ],
  },
  {
    heading: 'SUPPORT',
    links: [
      { label: 'SHIPPING', href: '#' },
      { label: 'RETURNS', href: '#' },
      { label: 'CONTACT', href: '#' },
    ],
  },
  {
    heading: 'FOLLOW',
    links: [
      { label: 'INSTAGRAM', href: '#' },
      { label: 'PINTEREST', href: '#' },
    ],
  },
];

export const footerBottom = {
  copyright: '© 2026 DIVINE RESSHA. ALL RIGHTS RESERVED.',
  tagline: 'FORMULATED WITH CARE · MADE IN SMALL BATCHES',
};
