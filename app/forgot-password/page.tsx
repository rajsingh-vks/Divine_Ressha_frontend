import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ForgotPasswordPanel from '../components/ForgotPasswordPanel';

export const metadata: Metadata = {
  title: 'Forgot Password | Divine Ressha',
};

export default function ForgotPasswordPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={null}>
          <ForgotPasswordPanel />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
