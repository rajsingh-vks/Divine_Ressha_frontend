import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import VerifyEmailPanel from '../components/VerifyEmailPanel';

export const metadata: Metadata = {
  title: 'Verify Email | Divine Ressha',
};

export default function VerifyEmailPage() {
  return (
    <>
      <Header />
      <main>
        <VerifyEmailPanel />
      </main>
      <Footer />
    </>
  );
}
