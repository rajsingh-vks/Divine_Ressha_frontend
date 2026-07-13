import type { Metadata } from 'next';
import AdminOrdersPanel from '@/app/components/AdminOrdersPanel';

export const metadata: Metadata = {
  title: 'Orders | Admin — Divine Ressha',
};

export default function AdminOrdersPage() {
  return <AdminOrdersPanel />;
}
