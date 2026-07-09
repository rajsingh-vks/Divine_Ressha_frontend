import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthForm from '../components/AuthForm';

export const metadata: Metadata = {
  title: 'Sign Up | Divine Ressha',
};

export default function SignupPage() {
  return (
    <>
      <Header />
      <main>
        <AuthForm mode="signup" />
      </main>
      <Footer />
    </>
  );
}
