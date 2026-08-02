import type { Metadata } from 'next';
import AdminRitualShowcasePanel from '@/app/components/AdminRitualShowcasePanel';

export const metadata: Metadata = {
  title: 'Ritual Showcase | Admin — Divine Ressha',
};

export default function AdminRitualShowcasePage() {
  return <AdminRitualShowcasePanel />;
}
