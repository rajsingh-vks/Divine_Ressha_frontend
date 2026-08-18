import type { Metadata } from 'next';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AuthForm from '../components/AuthForm';
import { buildPageMetadata } from '@/lib/seo';

export const metadata: Metadata = buildPageMetadata({
  title: 'Login to Divine Ressha',
  description: 'Sign in to your Divine Ressha account to manage orders, rituals, and personal preferences.',
  path: '/login',
});

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
