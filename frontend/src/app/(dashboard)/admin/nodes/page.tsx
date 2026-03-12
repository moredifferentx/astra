'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Save, RefreshCw } from 'lucide-react';

interface Plan {
  id: number;
  name: string;
}

interface NodeInfo {
  id: number;
  name: string;
  location: string;
  freeAllocations: number;
}

interface Allocation {
  planType: string;
  planCoinId: number | null;
  planRealId: number | null;
  nodeId: number;
  nodeName: string;
}

export default function AdminNodesPage() {
  const [coinPlans, setCoinPlans] = useState<Plan[]>([]);
  const [realPlans, setRealPlans] = useState<Plan[]>([]);
  const [nodes, setNodes] = useState<NodeInfo[]>([]);
  const [allocations, setAllocations] = useState<Allocation[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Track selected nodes per plan: "coin-1" -> Set of nodeIds
  const [selected, setSelected] = useState<Record<string, Set<number>>>({});

  useEffect(() => { loadAll(); }, []);

  async function loadAll() {
    setLoading(true);
    try {
      const [plansRes, nodesRes, allocRes] = await Promise.all([
        api.get('/plans'),
        api.get('/servers/nodes'),
        api.get('/admin/node-allocations'),
      ]);

      const cp = plansRes.data?.coin || [];
      const rp = plansRes.data?.real || [];
      setCoinPlans(cp);
      setRealPlans(rp);
      setNodes(nodesRes.data || []);

      const allocs: Allocation[] = allocRes.data || [];
      setAllocations(allocs);

      // Build selection map from allocations
      const sel: Record<string, Set<number>> = {};
      for (const p of cp) sel[`coin-${p.id}`] = new Set();
      for (const p of rp) sel[`real-${p.id}`] = new Set();
      for (const a of allocs) {
        const key = a.planType === 'coin' ? `coin-${a.planCoinId}` : `real-${a.planRealId}`;
        if (sel[key]) sel[key].add(a.nodeId);
      }
      setSelected(sel);
    } catch {
      toast.error('Failed to load data');
    } finally {
      setLoading(false);
    }
  }

  function toggleNode(planKey: string, nodeId: number) {
    setSelected((prev) => {
      const next = { ...prev };
      const set = new Set(next[planKey] || []);
      if (set.has(nodeId)) {
        set.delete(nodeId);
      } else {
        set.add(nodeId);
      }
      next[planKey] = set;
      return next;
    });
  }

  async function savePlan(planType: string, planId: number) {
    const key = `${planType}-${planId}`;
    const nodeIds = Array.from(selected[key] || []);
    setSaving(key);
    try {
      await api.put(`/admin/node-allocations/${planType}/${planId}`, {
        nodes: nodeIds.map((id) => ({
          nodeId: id,
          nodeName: nodes.find((n) => n.id === id)?.name || '',
        })),
      });
      toast.success('Node assignments saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(null);
    }
  }

  if (loading) {
    return (
      <div className="space-y-6 py-8">
        <h1 className="text-2xl font-bold">Node Assignments</h1>
        <div className="flex items-center gap-2 text-gray-400">
          <RefreshCw className="h-4 w-4 animate-spin" /> Loading…
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Node Assignments</h1>
        <p className="mt-1 text-sm text-gray-400">
          Configure which Pterodactyl nodes are available for each plan. If no nodes are selected, all nodes will be available.
        </p>
      </div>

      {nodes.length === 0 ? (
        <div className="rounded-xl border border-white/10 bg-white/[0.02] p-8 text-center text-gray-500">
          No nodes found from Pterodactyl panel.
        </div>
      ) : (
        <>
          {/* Coin Plans */}
          {coinPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-yellow-400">Coin Plans</h2>
              {coinPlans.map((plan) => {
                const key = `coin-${plan.id}`;
                const sel = selected[key] || new Set();
                return (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{plan.name}</h3>
                      <Button
                        size="sm"
                        onClick={() => savePlan('coin', plan.id)}
                        disabled={saving === key}
                      >
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {saving === key ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => toggleNode(key, node.id)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                            sel.has(node.id)
                              ? 'border-[#ff7a18] bg-[#ff7a18]/10 text-[#ff7a18]'
                              : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20'
                          }`}
                        >
                          {node.name}
                          <span className="ml-1 text-xs opacity-60">({node.freeAllocations} free)</span>
                        </button>
                      ))}
                    </div>
                    {sel.size === 0 && (
                      <p className="mt-2 text-xs text-gray-500">No nodes selected — all nodes available</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}

          {/* Real Plans */}
          {realPlans.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-green-400">Paid Plans</h2>
              {realPlans.map((plan) => {
                const key = `real-${plan.id}`;
                const sel = selected[key] || new Set();
                return (
                  <div key={key} className="rounded-xl border border-white/10 bg-white/[0.02] p-4">
                    <div className="flex items-center justify-between mb-3">
                      <h3 className="font-medium text-white">{plan.name}</h3>
                      <Button
                        size="sm"
                        onClick={() => savePlan('real', plan.id)}
                        disabled={saving === key}
                      >
                        <Save className="mr-1.5 h-3.5 w-3.5" />
                        {saving === key ? 'Saving…' : 'Save'}
                      </Button>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {nodes.map((node) => (
                        <button
                          key={node.id}
                          onClick={() => toggleNode(key, node.id)}
                          className={`rounded-lg border px-3 py-2 text-sm transition-all ${
                            sel.has(node.id)
                              ? 'border-[#ff7a18] bg-[#ff7a18]/10 text-[#ff7a18]'
                              : 'border-white/10 bg-white/[0.02] text-gray-400 hover:border-white/20'
                          }`}
                        >
                          {node.name}
                          <span className="ml-1 text-xs opacity-60">({node.freeAllocations} free)</span>
                        </button>
                      ))}
                    </div>
                    {sel.size === 0 && (
                      <p className="mt-2 text-xs text-gray-500">No nodes selected — all nodes available</p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </>
      )}
    </div>
  );
}
