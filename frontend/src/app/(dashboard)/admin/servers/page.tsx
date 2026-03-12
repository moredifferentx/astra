'use client';

import { useEffect, useState, useCallback } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { RefreshCw, Pause, Play, Trash2, Eye, ChevronLeft, ChevronRight } from 'lucide-react';

interface AdminServer {
  id: number;
  name: string;
  status: string;
  planType: string;
  location: string;
  pterodactylServerId: number | null;
  identifier: string | null;
  expiresAt: string;
  createdAt: string;
  user: { email: string };
  planCoin?: { name: string } | null;
  planReal?: { name: string } | null;
}

export default function AdminServersPage() {
  const [servers, setServers] = useState<AdminServer[]>([]);
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 0 });
  const limit = 30;

  const [syncing, setSyncing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<number | null>(null);
  const [deleteLoading, setDeleteLoading] = useState(false);
  const [viewServer, setViewServer] = useState<AdminServer | null>(null);

  const load = useCallback(async (q = search, p = page) => {
    try {
      const r = await api.get('/admin/servers', { params: { search: q, page: p, limit } });
      setServers(r.data.servers);
      setPagination(r.data.pagination);
    } catch {
      toast.error('Failed to load servers');
    }
  }, [search, page]);

  useEffect(() => { load(); }, [load]);

  async function handleSync() {
    setSyncing(true);
    try {
      const r = await api.get('/admin/servers/sync');
      toast.success(r.data.message);
      load();
    } catch {
      toast.error('Sync failed');
    } finally {
      setSyncing(false);
    }
  }

  async function handleSuspend(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/servers/${id}/suspend`);
      setServers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'suspended' } : s));
      toast.success('Server suspended');
    } catch {
      toast.error('Failed to suspend server');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleUnsuspend(id: number) {
    setActionLoading(id);
    try {
      await api.post(`/admin/servers/${id}/unsuspend`);
      setServers((prev) => prev.map((s) => s.id === id ? { ...s, status: 'active' } : s));
      toast.success('Server unsuspended');
    } catch {
      toast.error('Failed to unsuspend server');
    } finally {
      setActionLoading(null);
    }
  }

  async function handleDelete() {
    if (!deleteTarget) return;
    setDeleteLoading(true);
    try {
      await api.delete(`/admin/servers/${deleteTarget}`);
      toast.success('Server deleted');
      setServers((prev) => prev.filter((s) => s.id !== deleteTarget));
    } catch {
      toast.error('Failed to delete server');
    } finally {
      setDeleteLoading(false);
      setDeleteTarget(null);
    }
  }

  const statusColor = (status: string) => {
    switch (status) {
      case 'active': return 'text-green-400';
      case 'suspended': return 'text-yellow-400';
      default: return 'text-red-400';
    }
  };

  return (
    <div className="space-y-6 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Servers</h1>
        <Button size="sm" variant="secondary" onClick={handleSync} disabled={syncing}>
          <RefreshCw className={`mr-2 h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
          {syncing ? 'Syncing…' : 'Sync with Pterodactyl'}
        </Button>
      </div>

      <div className="flex gap-3">
        <Input
          placeholder="Search by name or user email…"
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
              <th className="px-4 py-3">Name</th>
              <th className="px-4 py-3">User</th>
              <th className="px-4 py-3">Plan</th>
              <th className="px-4 py-3">Location</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Ptero ID</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/10">
            {servers.map((s) => (
              <tr key={s.id} className="hover:bg-white/5">
                <td className="px-4 py-3 text-gray-400">#{s.id}</td>
                <td className="px-4 py-3 font-medium">{s.name || `Server #${s.id}`}</td>
                <td className="px-4 py-3 text-gray-300">{s.user.email}</td>
                <td className="px-4 py-3 text-gray-400">
                  {s.planCoin?.name || s.planReal?.name || s.planType}
                  <span className={`ml-1 text-xs ${s.planType === 'coin' ? 'text-yellow-400' : 'text-green-400'}`}>
                    ({s.planType})
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-400">{s.location || '—'}</td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-medium ${statusColor(s.status)}`}>{s.status}</span>
                </td>
                <td className="px-4 py-3 text-xs text-gray-500">{s.pterodactylServerId || '—'}</td>
                <td className="px-4 py-3 text-xs text-gray-400">{new Date(s.expiresAt).toLocaleDateString()}</td>
                <td className="px-4 py-3">
                  <div className="flex gap-2">
                    <Button size="sm" variant="secondary" onClick={() => setViewServer(s)} title="View">
                      <Eye className="h-3.5 w-3.5" />
                    </Button>
                    {s.status === 'active' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleSuspend(s.id)}
                        disabled={actionLoading === s.id}
                        title="Suspend"
                      >
                        <Pause className="h-3.5 w-3.5" />
                      </Button>
                    ) : s.status === 'suspended' ? (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleUnsuspend(s.id)}
                        disabled={actionLoading === s.id}
                        title="Unsuspend"
                      >
                        <Play className="h-3.5 w-3.5" />
                      </Button>
                    ) : null}
                    <Button size="sm" variant="destructive" onClick={() => setDeleteTarget(s.id)} title="Delete">
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
            {servers.length === 0 && (
              <tr><td colSpan={9} className="px-4 py-8 text-center text-gray-500">No servers found</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {pagination.pages > 1 && (
        <div className="flex items-center gap-3 text-sm">
          <Button size="sm" variant="secondary" disabled={page <= 1} onClick={() => { const p = page - 1; setPage(p); load(search, p); }}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-gray-400">{page} / {pagination.pages} ({pagination.total} servers)</span>
          <Button size="sm" variant="secondary" disabled={page >= pagination.pages} onClick={() => { const p = page + 1; setPage(p); load(search, p); }}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      )}

      {/* View Server Modal */}
      <Modal open={!!viewServer} onClose={() => setViewServer(null)} title={`Server: ${viewServer?.name || ''}`} className="max-w-lg">
        {viewServer && (
          <div className="space-y-3 text-sm">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs text-gray-500">Owner</p>
                <p className="text-gray-200">{viewServer.user.email}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Status</p>
                <p className={statusColor(viewServer.status)}>{viewServer.status}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Plan</p>
                <p className="text-gray-200">{viewServer.planCoin?.name || viewServer.planReal?.name || viewServer.planType}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Location</p>
                <p className="text-gray-200">{viewServer.location || 'Unknown'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Ptero ID</p>
                <p className="text-gray-200">{viewServer.pterodactylServerId || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Identifier</p>
                <p className="text-gray-200">{viewServer.identifier || '—'}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Created</p>
                <p className="text-gray-200">{new Date(viewServer.createdAt).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500">Expires</p>
                <p className="text-gray-200">{new Date(viewServer.expiresAt).toLocaleString()}</p>
              </div>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmModal
        open={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={handleDelete}
        title="Delete Server"
        message="This will permanently delete the server from both the panel and database. This action cannot be undone."
        confirmLabel="Delete Server"
        confirmVariant="destructive"
        loading={deleteLoading}
      />
    </div>
  );
}
