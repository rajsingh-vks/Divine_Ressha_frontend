import type { Metadata } from 'next';
import AdminDashboardPanel from '@/app/components/AdminDashboardPanel';

export const metadata: Metadata = {
  title: 'Admin Dashboard | Divine Ressha',
};

export default function AdminDashboardPage() {
  return <AdminDashboardPanel />;
}
