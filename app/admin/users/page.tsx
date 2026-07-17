import type { Metadata } from 'next';
import AdminUsersPanel from '../../components/AdminUsersPanel';

export const metadata: Metadata = {
  title: 'Users | Admin — Divine Ressha',
};

export default function AdminUsersPage() {
  return <AdminUsersPanel />;
}
