'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { PromptModal } from '@/components/ui/PromptModal';
import { Server, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface User {
  id: number;
  email: string;
  role: string;
  coins: number;
  balance: number;
  flagged: boolean;
  ipAddress: string | null;
  lastLoginIp: string | null;
  createdAt: string;
  _count: { servers: number };
}

interface UserServer {
  id: number;
  name: string;
  status: string;
  location: string;
  planType: string;
  expiresAt: string;
  planCoin?: { name: string; ram: number; cpu: number; storage: number } | null;
  planReal?: { name: string; ram: number; cpu: number; storage: number } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const limit = 30;

  const [coinTarget, setCoinTarget] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [manageUser, setManageUser] = useState<User | null>(null);
  const [userServers, setUserServers] = useState<UserServer[]>([]);
  const [serversLoading, setServersLoading] = useState(false);

  const load = useCallback(async (q = search, p = page) => {
    try {
      const r = await api.get('/admin/users', { params: { search: q, page: p, limit } });
      setUsers(r.data.users);
      setPagination(r.data.pagination);
    } catch {
      toast.error('Failed to load users');
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function toggleBan(userId: number, flagged: boolean) {
    try {
      await api.patch(`/admin/users/${userId}`, { flagged: !flagged });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, flagged: !flagged } : u));
    } catch {
      toast.error('Failed to update user');
    }
  }

  async function adjustCoins(userId: number, raw: string) {
    const delta = parseInt(raw, 10);
    if (isNaN(delta)) return;
    try {
      await api.patch(`/admin/users/${userId}`, { coinDelta: delta });
      setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, coins: u.coins + delta } : u));
      toast.success('Coins updated');
    } catch {
      toast.error('Failed to update coins');
    } finally {
      setCoinTarget(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/users/${deleteTarget}`);
      toast.success('User deleted');
      setUsers((prev) => prev.filter((u) => u.id !== deleteTarget));
    } catch {
      toast.error('Failed to delete user');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  async function openManage(user: User) {
    setManageUser(user);
    setServersLoading(true);
    try {
      const r = await api.get(`/admin/users/${user.id}/servers`);
      setUserServers(r.data);
    } catch {
      toast.error('Failed to load servers');
      setUserServers([]);
    } finally {
      setServersLoading(false);
    }
  }

  return (
    <div className="space-y-6 py-8">
      <h1 className="text-2xl font-bold">Users</h1>

      <div className="flex gap-3">
        <Input
          placeholder="Search by email…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { setPage(1); load(search, 1); } }}
          className="max-w-xs"
        />
        <Button size="sm" onClick={() => { setPage(1); load(search, 1); }}>Search</Button>
      </div>

      <div className="overflow-x-auto rounded-xl border border-white/10">
        <table className="w-full text-sm">
          <thead className="border-b border-white/10 text-left text-xs text-gray-400">
            <tr>
              <th className="px-4 py-3">ID</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Servers</th>
              <th className="px-4 py-3">Coins</th>
              <th className="px-4 py-3">Balance</th>
              <th className="px-4 py-3">IP</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Joined</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {users.map((u) => (
              <tr key={u.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-gray-400">#{u.id}</td>
                <td className="px-4 py-3 font-medium">{u.email}</td>
                <td className="px-4 py-3">
                  <span className="inline-flex items-center gap-1 text-blue-400">
                    <Server className="h-3 w-3" /> {u._count.servers}
                  </span>
                </td>
                <td className="px-4 py-3 text-yellow-400">{u.coins}</td>
                <td className="px-4 py-3 text-green-400">₹{u.balance.toFixed(2)}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{u.lastLoginIp || u.ipAddress || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs ${u.flagged ? 'text-red-400' : 'text-green-400'}`}>
                    {u.flagged ? 'Banned' : 'Active'}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400 text-xs">{new Date(u.createdAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => openManage(u)} title="Manage">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    <Button size="sm" variant="secondary" onClick={() => setCoinTarget(u.id)}>
                      Coins
                    </Button>
                    <Button
                      size="sm"
                      variant={u.flagged ? 'secondary' : 'destructive'}
                      onClick={() => toggleBan(u.id, u.flagged)}
                    >
                      {u.flagged ? 'Unban' : 'Ban'}
                    </Button>
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(u.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {users.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No users found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(search, p); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-gray-400">{page} / {pagination.pages} ({pagination.total} users)</span>
          <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => { const p = page + 1; setPage(p); load(search, p); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* Manage User Modal */}
      <Modal open={!!manageUser} onClose={() => setManageUser(null)} title={`Manage: ${manageUser?.email}`} className="max-w-2xl">
        {serversLoading ? (
          <div className="py-8 text-center text-gray-400">Loading servers…</div>
        ) : userServers.length === 0 ? (
          <div className="py-8 text-center text-gray-500">No servers found for this user.</div>
        ) : (
          <div className="max-h-96 overflow-y-auto space-y-3">
            {userServers.map((s) => {
              const plan = s.planCoin || s.planReal;
              return (
                <div key={s.id} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/[0.02] px-4 py-3">
                  <div>
                    <p className="font-medium text-white">{s.name || `Server #${s.id}`}</p>
                    <p className="text-xs text-gray-400">
                      {plan?.name || s.planType} • {s.location || 'Unknown'} •{' '}
                      <span className={s.status === 'active' ? 'text-green-400' : 'text-red-400'}>{s.status}</span>
                    </p>
                  </div>
                  <div className="text-xs text-gray-500">
                    Expires: {new Date(s.expiresAt).toLocaleDateString()}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Modal>

      {/* Adjust Coins Modal */}
      <PromptModal
        open={!!coinTarget}
        onClose={() => setCoinTarget(null)}
        onSubmit={(value) => coinTarget && adjustCoins(coinTarget, value)}
        title="Adjust Coins"
        message="Enter the coin adjustment amount. Use a positive number to add or negative to subtract."
        label="Amount"
        placeholder="e.g. 100 or -50"
        type="number"
        submitLabel="Apply"
      />

      {/* Delete User Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete User"
        message="This will permanently delete the user and all their servers. This action cannot be undone."
        confirmLabel="Delete User"
        confirmVariant="destructive"
        loading={deleteLoading}
      />
    </div>
  );
}
