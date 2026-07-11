import type { Metadata } from 'next';
import './globals.css';
import { ShopActionsProvider } from './components/ShopActionsProvider';

export const metadata: Metadata = {
  title: 'Divine Ressha',
  description: 'Maison Botanical Body Wash — a plant-derived ritual for the shower.',
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
      </body>
    </html>
  );
}
