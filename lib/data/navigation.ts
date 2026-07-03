export interface NavigationLink {
  label: string;
  href: string;
}

export const navigationLinks: NavigationLink[] = [
  { label: 'SHOP', href: '#shop' },
  { label: 'RITUAL', href: '#ritual' },
  { label: 'JOURNAL', href: '#journal' },
];

export const brandName = 'DIVINE RESSHA';

export const headerText = {
  searchLabel: 'Search',
  bagLabel: 'Shopping bag',
};
