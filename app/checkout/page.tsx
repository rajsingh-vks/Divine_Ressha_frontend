import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import CheckoutPanel from '../components/CheckoutPanel';

export const metadata: Metadata = {
  title: 'Checkout | Divine Ressha',
};

export default function CheckoutPage() {
  return (
    <>
      <Header />
      <main>
        <CheckoutPanel />
      </main>
      <Footer />
    </>
  );
}
