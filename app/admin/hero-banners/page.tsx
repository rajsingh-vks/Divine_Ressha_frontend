import type { Metadata } from 'next';
import AdminHeroBannersPanel from '@/app/components/AdminHeroBannersPanel';

export const metadata: Metadata = {
  title: 'Hero Banners | Admin — Divine Ressha',
};

export default function AdminHeroBannersPage() {
  return <AdminHeroBannersPanel />;
}
