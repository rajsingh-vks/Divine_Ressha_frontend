import type { Metadata } from 'next';
import AdminLoginForm from '@/app/components/AdminLoginForm';

export const metadata: Metadata = {
  title: 'Admin Login | Divine Ressha',
};

export default function AdminLoginPage() {
  return <AdminLoginForm />;
}
