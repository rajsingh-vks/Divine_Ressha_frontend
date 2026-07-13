import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CartItemsPanel from '../components/CartItemsPanel';

export const metadata: Metadata = {
  title: 'Cart | Divine Ressha',
};

export default function CartPage() {
  return (
    <>
      <Header />
      <main>
        <CartItemsPanel />
      </main>
      <Footer />
    </>
  );
}
