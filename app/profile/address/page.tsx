import type { Metadata } from 'next';
import Header from '../../components/Header';
import Footer from '../../components/Footer';
import ProfilePanel from '../../components/ProfilePanel';

export const metadata: Metadata = {
  title: 'Manage Addresses | Divine Ressha',
};

export default function ProfileAddressPage() {
  return (
    <>
      <Header />
      <main>
        <ProfilePanel activeTab="address" />
      </main>
      <Footer />
    </>
  );
}
