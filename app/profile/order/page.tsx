import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProfilePanel from '../../components/ProfilePanel';

export const metadata: Metadata = {
  title: 'Order History | Divine Ressha',
};

export default function ProfileOrderPage() {
  return (
    <>
      <Header />
      <main>
        <ProfilePanel activeTab="order" />
      </main>
      <Footer />
    </>
  );
}
