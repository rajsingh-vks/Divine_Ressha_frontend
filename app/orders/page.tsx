import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import OrdersPanel from '../components/OrdersPanel';

export const metadata: Metadata = {
  title: 'My Orders | Divine Ressha',
};

export default function OrdersPage() {
  return (
    <>
      <Header />
      <main>
        <OrdersPanel />
      </main>
      <Footer />
    </>
  );
}
