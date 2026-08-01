import type { Metadata } from 'next';
import { Suspense } from 'react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import ForgotPasswordPanel from '../components/ForgotPasswordPanel';

export const metadata: Metadata = {
  title: 'Reset Password | Divine Ressha',
};

export default function ResetPasswordPage() {
  return (
    <>
      <Header />
      <main>
        <Suspense fallback={null}>
          <ForgotPasswordPanel mode="reset" />
        </Suspense>
      </main>
      <Footer />
    </>
  );
}
