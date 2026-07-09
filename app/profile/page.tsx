import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ProfilePanel from '../components/ProfilePanel';

export const metadata: Metadata = {
  title: 'Profile | Divine Ressha',
};

export default function ProfilePage() {
  return (
    <>
      <Header />
      <main>
        <ProfilePanel />
      </main>
      <Footer />
    </>
  );
}
