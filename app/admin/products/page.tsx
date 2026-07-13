import type { Metadata } from 'next';
import AdminProductsPanel from '@/app/components/AdminProductsPanel';

export const metadata: Metadata = {
  title: 'Products | Admin — Divine Ressha',
};

export default function AdminProductsPage() {
  return <AdminProductsPanel />;
}
