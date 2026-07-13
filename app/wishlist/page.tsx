import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import WishlistItemsPanel from '../components/WishlistItemsPanel';

export const metadata: Metadata = {
  title: 'Wishlist | Divine Ressha',
};

export default function WishlistPage() {
  return (
    <>
      <Header />
      <main>
        <WishlistItemsPanel />
      </main>
      <Footer />
    </>
  );
}
