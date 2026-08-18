import type { Metadata } from 'next';
import './globals.css';
import { ShopActionsProvider } from './components/ShopActionsProvider';
import AppMotion from './components/AppMotion';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = {
  ...buildPageMetadata({
    title: 'Divine Ressha | Botanical Body Care & Fragrance Rituals',
    description:
      'Divine Ressha creates botanical body care, luxurious fragrance rituals, and modern self-care essentials inspired by nature and wellness.',
    path: '/',
  }),
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'https://www.divineressha.com'),
  applicationName: 'Divine Ressha',
  keywords: [
    'Divine Ressha',
    'botanical body wash',
    'fragrance ritual',
    'body care India',
    'luxury self care',
  ],
  openGraph: {
    ...buildPageMetadata({
      title: 'Divine Ressha | Botanical Body Care & Fragrance Rituals',
      description:
        'Divine Ressha creates botanical body care, luxurious fragrance rituals, and modern self-care essentials inspired by nature and wellness.',
      path: '/',
    }).openGraph,
    type: 'website',
    locale: 'en_IN',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Divine Ressha | Botanical Body Care & Fragrance Rituals',
    description:
      'Divine Ressha creates botanical body care, luxurious fragrance rituals, and modern self-care essentials inspired by nature and wellness.',
  },
  icons: {
    icon: '/favicon.ico',
    shortcut: '/favicon.ico',
    apple: '/favicon.ico',
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <ShopActionsProvider>{children}</ShopActionsProvider>
        <AppMotion />
      </body>
    </html>
  );
}
