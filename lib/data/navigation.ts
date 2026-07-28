export interface NavigationLink {
  label: string;
  href: string;
}

export const navigationLinks: NavigationLink[] = [
  { label: 'HOME', href: '/' },
  { label: 'PRODUCTS', href: '/products' },
  { label: 'ABOUT US', href: '/about' },
  { label: 'CONTACT', href: '/contact' },
  { label: 'PRIVACY POLICY', href: '/privacy-policy' },
  { label: 'TERMS & CONDITIONS', href: '/terms-conditions' },
];

export const brandName = 'DIVINE RESSHA';

export const headerText = {
  searchLabel: 'Search',
  bagLabel: 'Shopping bag',
};
