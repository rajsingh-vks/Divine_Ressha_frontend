import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthForm from '../components/AuthForm';

export const metadata: Metadata = {
  title: 'Login | Divine Ressha',
};

export default function LoginPage() {
  return (
    <>
      <Header />
      <main>
        <AuthForm mode="login" />
      </main>
      <Footer />
    </>
  );
}
