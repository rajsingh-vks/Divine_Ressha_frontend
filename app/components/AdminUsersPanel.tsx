'use client';

import { useEffect, useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  ADMIN_AUTH_SESSION_KEY,
  ADMIN_AUTH_TOKEN_KEY,
  ADMIN_AUTH_USER_KEY,
} from '@/lib/constants/auth';
import AdminSidebar from '@/app/components/AdminSidebar';

type AdminUser = { id?: string; email?: string; name?: string; role?: string };

const USERS_PER_PAGE = 5;

type User = {
  id: string;
  email: string;
  full_name?: string | null;
  phone?: string | null;
  role?: 'customer' | 'vendor' | 'admin';
  status?: 'pending' | 'active' | 'inactive' | 'suspended' | 'deleted';
  email_verified?: boolean;
  created_at?: string;
};

const getApiErrorMessage = async (response: Response, fallback: string) => {
  try {
    const payload = (await response.json()) as { detail?: string; message?: string; error?: string };
    return payload.detail || payload.message || payload.error || fallback;
  } catch {
    return fallback;
  }
};

const formatDate = (value?: string) => {
  if (!value) return '—';
  return new Intl.DateTimeFormat('en-IN', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));
};

export default function AdminUsersPanel() {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [adminUser, setAdminUser] = useState<AdminUser | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [fetchError, setFetchError] = useState('');
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [deletingUserId, setDeletingUserId] = useState('');
  const [deletingHard, setDeletingHard] = useState(false);

  const getAuthHeaders = () => {
    const token = localStorage.getItem(ADMIN_AUTH_TOKEN_KEY);
    return token ? { Authorization: `Bearer ${token}` } : undefined;
  };

  const fetchUsers = async () => {
    setLoadingUsers(true);
    setFetchError('');

    try {
      const response = await fetch('/api/users?limit=100', {
        method: 'GET',
        credentials: 'include',
        headers: getAuthHeaders(),
        cache: 'no-store',
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to fetch users.'));
      }

      const payload = (await response.json()) as User[];
      const allUsers = Array.isArray(payload) ? payload : [];
      setUsers(allUsers.filter((user) => (user.status || '').toLowerCase() !== 'deleted'));
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to fetch users.');
    } finally {
      setLoadingUsers(false);
    }
  };

  useEffect(() => {
    const hasSession = localStorage.getItem(ADMIN_AUTH_SESSION_KEY) === '1';
    const hasToken = Boolean(localStorage.getItem(ADMIN_AUTH_TOKEN_KEY));
    const rawUser = localStorage.getItem(ADMIN_AUTH_USER_KEY);
    if (!hasSession && !hasToken) {
      router.replace('/admin/login');
      return;
    }
    if (!rawUser) {
      router.replace('/admin/login');
      return;
    }
    try {
      const parsed = JSON.parse(rawUser) as AdminUser;
      if (parsed.role !== 'admin') {
        router.replace('/admin/login');
        return;
      }
      setAdminUser(parsed);
      setReady(true);
    } catch {
      router.replace('/admin/login');
    }
  }, [router]);

  useEffect(() => {
    if (!ready) return;
    void fetchUsers();
  }, [ready]);

  const displayName = adminUser?.name || adminUser?.email || 'Admin';
  const initials = displayName
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');

  const handleLogout = () => {
    localStorage.removeItem(ADMIN_AUTH_TOKEN_KEY);
    localStorage.removeItem(ADMIN_AUTH_SESSION_KEY);
    localStorage.removeItem(ADMIN_AUTH_USER_KEY);
    router.replace('/admin/login');
  };

  const handleDeleteUser = async (user: User, hard: boolean) => {
    const name = user.full_name || user.email;
    const actionLabel = hard ? 'permanently delete' : 'soft delete';
    if (!window.confirm(`Are you sure you want to ${actionLabel} user ${name}?${hard ? ' This removes the account from the database.' : ''}`)) return;

    if (hard && adminUser?.id && adminUser.id === user.id) {
      setFetchError('You cannot hard-delete your own admin account.');
      return;
    }

    setDeletingUserId(user.id);
    setDeletingHard(hard);
    setFetchError('');

    try {
      const response = await fetch(`/api/users/${encodeURIComponent(user.id)}${hard ? '?hard=true' : ''}`, {
        method: 'DELETE',
        credentials: 'include',
        headers: getAuthHeaders(),
      });

      if (!response.ok) {
        throw new Error(await getApiErrorMessage(response, 'Unable to delete user.'));
      }

      setUsers((current) => current.filter((item) => item.id !== user.id));
      await fetchUsers();
    } catch (error) {
      setFetchError(error instanceof Error ? error.message : 'Unable to delete user.');
    } finally {
      setDeletingUserId('');
      setDeletingHard(false);
    }
  };

  const filteredUsers = useMemo(() => {
    const needle = search.trim().toLowerCase();
    if (!needle) return users;
    return users.filter((user) =>
      [user.full_name || '', user.email || '', user.phone || '', user.role || '', user.status || '']
        .join(' ')
        .toLowerCase()
        .includes(needle)
    );
  }, [search, users]);

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const totalPages = Math.max(1, Math.ceil(filteredUsers.length / USERS_PER_PAGE));

  useEffect(() => {
    if (currentPage > totalPages) {
      setCurrentPage(totalPages);
    }
  }, [currentPage, totalPages]);

  const paginatedUsers = useMemo(() => {
    const start = (currentPage - 1) * USERS_PER_PAGE;
    return filteredUsers.slice(start, start + USERS_PER_PAGE);
  }, [filteredUsers, currentPage]);

  const pageStart = filteredUsers.length === 0 ? 0 : (currentPage - 1) * USERS_PER_PAGE + 1;
  const pageEnd = Math.min(currentPage * USERS_PER_PAGE, filteredUsers.length);

  if (!ready) {
    return (
      <section className="admin-dashboard-shell">
        <div className="admin-dashboard-loading"><p>Loading…</p></div>
      </section>
    );
  }

  return (
    <section className="admin-dashboard-shell">
      <div className="admin-dashboard-layout">
        <AdminSidebar displayName={displayName} initials={initials} onLogout={handleLogout} />

        <main className="admin-main">
          <header className="admin-topbar">
            <div className="admin-search-wrap">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="11" cy="11" r="8" />
                <path d="m21 21-4.35-4.35" />
              </svg>
              <input
                type="search"
                placeholder="Search users by name, email, role or status"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                aria-label="Search users"
              />
            </div>

            <div className="admin-user-pill">
              <span>{initials || 'AD'}</span>
              <div>
                <strong>{displayName}</strong>
                <small>Admin</small>
              </div>
            </div>
          </header>

          <section className="admin-page-heading">
            <div>
              <p className="admin-overline">Management</p>
              <h1 className="admin-page-title">Users</h1>
            </div>
            <button type="button" className="admin-ghost-button" onClick={() => void fetchUsers()} disabled={loadingUsers}>
              {loadingUsers ? 'Refreshing…' : 'Refresh'}
            </button>
          </section>

          {fetchError ? <p className="admin-products-error">{fetchError}</p> : null}

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>User</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Role</th>
                  <th>Status</th>
                  <th>Email verified</th>
                  <th>Joined</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {paginatedUsers.length > 0 ? (
                  paginatedUsers.map((user) => (
                    <tr key={user.id}>
                      <td>
                        <strong>{user.full_name || '—'}</strong>
                      </td>
                      <td>{user.email || '—'}</td>
                      <td>{user.phone || '—'}</td>
                      <td>{user.role || '—'}</td>
                      <td>{user.status || '—'}</td>
                      <td>{user.email_verified ? 'Yes' : 'No'}</td>
                      <td>{formatDate(user.created_at)}</td>
                      <td>
                        <div className="admin-row-actions">
                          <button
                            type="button"
                            className="admin-row-button"
                            onClick={() => void handleDeleteUser(user, false)}
                            disabled={deletingUserId === user.id}
                          >
                            {deletingUserId === user.id && !deletingHard ? 'Deleting…' : 'Soft delete'}
                          </button>
                          <button
                            type="button"
                            className="admin-row-button danger"
                            onClick={() => void handleDeleteUser(user, true)}
                            disabled={deletingUserId === user.id || (adminUser?.id ? adminUser.id === user.id : false)}
                            title={adminUser?.id === user.id ? 'You cannot hard-delete your own account' : 'Permanently remove from database'}
                          >
                            {deletingUserId === user.id && deletingHard ? 'Deleting…' : 'Hard delete'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={8} className="admin-table-empty">
                      {loadingUsers ? 'Loading users…' : 'No users found.'}
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {filteredUsers.length ? (
            <div className="admin-pagination">
              <p className="admin-pagination-meta">
                Showing {pageStart}–{pageEnd} of {filteredUsers.length} users
              </p>

              <div className="admin-pagination-actions" aria-label="Users pagination">
                <button
                  type="button"
                  className="admin-row-button"
                  onClick={() => setCurrentPage((prev) => Math.max(1, prev - 1))}
                  disabled={currentPage === 1}
                >
                  Prev
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1).map((page) => (
                  <button
                    key={page}
                    type="button"
                    className={`admin-row-button${page === currentPage ? ' active' : ''}`}
                    onClick={() => setCurrentPage(page)}
                    aria-current={page === currentPage ? 'page' : undefined}
                  >
                    {page}
                  </button>
                ))}

                <button
                  type="button"
                  className="admin-row-button"
                  onClick={() => setCurrentPage((prev) => Math.min(totalPages, prev + 1))}
                  disabled={currentPage === totalPages}
                >
                  Next
                </button>
              </div>
            </div>
          ) : null}
        </main>
      </div>
    </section>
  );
}
