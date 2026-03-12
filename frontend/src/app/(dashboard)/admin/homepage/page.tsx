'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { cn } from '@/lib/cn';
import {
  Plus, Trash2, Eye, EyeOff,
  Zap, Cpu, Globe, Shield, Package, Code2,
  Clock, Gift, Coins,
} from 'lucide-react';

type Tab = 'hero' | 'stats' | 'features' | 'rewards';

const TABS: { key: Tab; label: string }[] = [
  { key: 'hero', label: 'Hero Section' },
  { key: 'stats', label: 'Stats Bar' },
  { key: 'features', label: 'Features' },
  { key: 'rewards', label: 'Rewards' },
];

// ── Textarea helper ──────────────────────────────────────────────────────────
function Textarea({ label, value, onChange, rows = 3 }: { label: string; value: string; onChange: (v: string) => void; rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-sm font-medium text-gray-300">{label}</label>
      <textarea
        rows={rows}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3.5 py-2.5 text-sm text-gray-100 placeholder-gray-500 focus:border-[#ff7a18]/50 focus:outline-none focus:ring-2 focus:ring-[#ff7a18]/20"
      />
    </div>
  );
}

// ── Hero Editor ──────────────────────────────────────────────────────────────
function HeroEditor({ data, setData }: { data: any; setData: (d: any) => void }) {
  return (
    <div className="space-y-4">
      <Input label="Badge Text" value={data.badge || ''} onChange={(e) => setData({ ...data, badge: e.target.value })} placeholder="Powered by Pterodactyl" />
      <Input label="Heading (first part)" value={data.headingBefore || ''} onChange={(e) => setData({ ...data, headingBefore: e.target.value })} placeholder="Hosting crafted for" />
      <Input label="Heading (highlighted)" value={data.headingHighlight || ''} onChange={(e) => setData({ ...data, headingHighlight: e.target.value })} placeholder="Minecraft empires." />
      <Textarea label="Subtitle" value={data.subtitle || ''} onChange={(v) => setData({ ...data, subtitle: v })} />
      <Input label="Primary Button Text" value={data.primaryBtn || ''} onChange={(e) => setData({ ...data, primaryBtn: e.target.value })} placeholder="Deploy Server" />
      <Input label="Primary Button Link" value={data.primaryLink || ''} onChange={(e) => setData({ ...data, primaryLink: e.target.value })} placeholder="/login" />
      <Input label="Secondary Button Text" value={data.secondaryBtn || ''} onChange={(e) => setData({ ...data, secondaryBtn: e.target.value })} placeholder="View Plans" />
      <Input label="Secondary Button Link" value={data.secondaryLink || ''} onChange={(e) => setData({ ...data, secondaryLink: e.target.value })} placeholder="#plans" />
    </div>
  );
}

// ── Stats Editor ─────────────────────────────────────────────────────────────
function StatsEditor({ data, setData }: { data: any; setData: (d: any) => void }) {
  const items: any[] = data.items || [];
  function update(idx: number, key: string, val: string) {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: val };
    setData({ ...data, items: next });
  }
  function add() { setData({ ...data, items: [...items, { value: '', label: '', desc: '' }] }); }
  function remove(idx: number) { setData({ ...data, items: items.filter((_: any, i: number) => i !== idx) }); }
  return (
    <div className="space-y-4">
      {items.map((item: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Stat #{i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <Input label="Value" value={item.value || ''} onChange={(e) => update(i, 'value', e.target.value)} placeholder="99.9%" />
            <Input label="Label" value={item.label || ''} onChange={(e) => update(i, 'label', e.target.value)} placeholder="Uptime" />
            <Input label="Description" value={item.desc || ''} onChange={(e) => update(i, 'desc', e.target.value)} placeholder="Enterprise-grade" />
          </div>
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Add Stat</Button>
    </div>
  );
}

// ── Features Editor ──────────────────────────────────────────────────────────
function FeaturesEditor({ data, setData }: { data: any; setData: (d: any) => void }) {
  const items: any[] = data.items || [];
  function update(idx: number, key: string, val: string) {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: val };
    setData({ ...data, items: next });
  }
  function add() { setData({ ...data, items: [...items, { title: '', description: '' }] }); }
  function remove(idx: number) { setData({ ...data, items: items.filter((_: any, i: number) => i !== idx) }); }
  return (
    <div className="space-y-4">
      <Input label="Section Title" value={data.sectionTitle || ''} onChange={(e) => setData({ ...data, sectionTitle: e.target.value })} placeholder="Everything you need to dominate" />
      <Input label="Section Subtitle" value={data.sectionSubtitle || ''} onChange={(e) => setData({ ...data, sectionSubtitle: e.target.value })} />
      {items.map((item: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Feature #{i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
          </div>
          <Input label="Title" value={item.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
          <Textarea label="Description" value={item.description || ''} onChange={(v) => update(i, 'description', v)} rows={2} />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Add Feature</Button>
    </div>
  );
}

// ── Rewards Editor ───────────────────────────────────────────────────────────
function RewardsEditor({ data, setData }: { data: any; setData: (d: any) => void }) {
  const items: any[] = data.items || [];
  function update(idx: number, key: string, val: string) {
    const next = [...items];
    next[idx] = { ...next[idx], [key]: val };
    setData({ ...data, items: next });
  }
  function add() { setData({ ...data, items: [...items, { title: '', description: '', coins: '' }] }); }
  function remove(idx: number) { setData({ ...data, items: items.filter((_: any, i: number) => i !== idx) }); }
  return (
    <div className="space-y-4">
      <Input label="Section Title" value={data.sectionTitle || ''} onChange={(e) => setData({ ...data, sectionTitle: e.target.value })} />
      <Input label="Section Subtitle" value={data.sectionSubtitle || ''} onChange={(e) => setData({ ...data, sectionSubtitle: e.target.value })} />
      {items.map((item: any, i: number) => (
        <div key={i} className="rounded-xl border border-white/10 bg-white/[0.02] p-4 space-y-3">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium text-gray-400">Reward #{i + 1}</span>
            <button onClick={() => remove(i)} className="text-red-400 hover:text-red-300"><Trash2 className="h-4 w-4" /></button>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <Input label="Title" value={item.title || ''} onChange={(e) => update(i, 'title', e.target.value)} />
            <Input label="Coin Badge" value={item.coins || ''} onChange={(e) => update(i, 'coins', e.target.value)} placeholder="+5/hr" />
          </div>
          <Textarea label="Description" value={item.description || ''} onChange={(v) => update(i, 'description', v)} rows={2} />
        </div>
      ))}
      <Button variant="secondary" size="sm" onClick={add} className="gap-2"><Plus className="h-4 w-4" /> Add Reward</Button>
    </div>
  );
}

// ── Preview Components ───────────────────────────────────────────────────────

function HeroPreview({ data }: { data: any }) {
  const d = {
    badge: 'Powered by Pterodactyl',
    headingBefore: 'Hosting crafted for',
    headingHighlight: 'Minecraft empires.',
    subtitle: 'Deploy powerful game servers instantly with enterprise infrastructure and gamer-friendly pricing.',
    primaryBtn: 'Deploy Server',
    secondaryBtn: 'View Plans',
    ...data,
  };
  return (
    <div className="relative overflow-hidden rounded-xl bg-[#0a0a0a] p-8 lg:p-12">
      <div className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-20 -top-20 h-[300px] w-[300px] rounded-full bg-[#ff7a18]/10 blur-[100px]" />
      </div>
      <div className="inline-flex items-center gap-2 rounded-full border border-[#ff7a18]/20 bg-[#ff7a18]/10 px-3 py-1 text-xs text-orange-300">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#ff7a18] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#ff7a18]" />
        </span>
        {d.badge}
      </div>
      <h1 className="mt-4 text-3xl font-extrabold leading-tight tracking-tight text-white lg:text-4xl">
        {d.headingBefore}{' '}
        <span className="bg-gradient-to-r from-[#ff7a18] to-orange-400 bg-clip-text text-transparent">{d.headingHighlight}</span>
      </h1>
      <p className="mt-3 max-w-xl text-sm leading-relaxed text-gray-400">{d.subtitle}</p>
      <div className="mt-6 flex flex-wrap gap-3">
        <span className="inline-flex items-center rounded-xl bg-gradient-to-r from-[#ff7a18] to-orange-500 px-5 py-2 text-sm font-semibold text-white shadow-lg shadow-[#ff7a18]/25">
          {d.primaryBtn}
        </span>
        <span className="inline-flex items-center rounded-xl border border-gray-700 bg-white/5 px-5 py-2 text-sm font-semibold text-gray-200">
          {d.secondaryBtn}
        </span>
      </div>
    </div>
  );
}

function StatsPreview({ data }: { data: any }) {
  const items: any[] = data?.items || [];
  if (!items.length) return <p className="text-center text-sm text-gray-500">No stats added yet.</p>;
  return (
    <div className="rounded-xl bg-[#0a0a0a] p-6">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {items.map((item: any, i: number) => (
          <div key={i} className="text-center">
            <p className="text-2xl font-bold text-white">{item.value || '—'}</p>
            <p className="text-sm font-medium text-gray-300">{item.label || 'Label'}</p>
            <p className="text-xs text-gray-500">{item.desc || ''}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

const FEATURE_ICONS = [Zap, Cpu, Globe, Shield, Package, Code2];

function FeaturesPreview({ data }: { data: any }) {
  const items: any[] = data?.items || [];
  const title = data?.sectionTitle || 'Everything you need to dominate';
  const subtitle = data?.sectionSubtitle || '';
  return (
    <div className="rounded-xl bg-[#0a0a0a] p-6">
      <div className="text-center">
        <span className="mb-3 inline-block rounded-full border border-[#ff7a18]/20 bg-[#ff7a18]/10 px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider text-orange-300">
          Features
        </span>
        <h2 className="text-xl font-bold text-white">{title}</h2>
        {subtitle && <p className="mx-auto mt-2 max-w-md text-xs text-gray-400">{subtitle}</p>}
      </div>
      {items.length === 0 ? (
        <p className="mt-6 text-center text-sm text-gray-500">No features added yet.</p>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((f: any, i: number) => {
            const Icon = FEATURE_ICONS[i % FEATURE_ICONS.length];
            return (
              <div key={i} className="rounded-lg border border-gray-800 bg-[#161616] p-4">
                <div className="mb-2 flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7a18]/10">
                  <Icon className="h-4 w-4 text-[#ff7a18]" />
                </div>
                <h3 className="text-sm font-semibold text-white">{f.title || 'Untitled'}</h3>
                <p className="mt-1 text-xs text-gray-400">{f.description || ''}</p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

const REWARD_ICONS = [Clock, Gift, Zap];

function RewardsPreview({ data }: { data: any }) {
  const items: any[] = data?.items || [];
  const title = data?.sectionTitle || 'Earn Coins While You Stay Online';
  const subtitle = data?.sectionSubtitle || '';
  return (
    <div className="rounded-xl bg-[#0a0a0a] p-6">
      <div className="grid items-center gap-6 lg:grid-cols-2">
        <div>
          <span className="mb-3 inline-block rounded-full border border-[#ff7a18]/20 bg-[#ff7a18]/10 px-3 py-0.5 text-[10px] font-medium uppercase tracking-wider text-orange-300">
            Rewards
          </span>
          <h2 className="text-xl font-bold text-white">{title}</h2>
          {subtitle && <p className="mt-2 text-xs text-gray-400">{subtitle}</p>}
          <div className="mt-4 inline-flex items-center gap-2 rounded-xl border border-[#ff7a18]/20 bg-[#ff7a18]/5 px-4 py-2">
            <Coins className="h-5 w-5 text-[#ff7a18]" />
            <div>
              <p className="text-[10px] text-gray-500">Your Balance</p>
              <p className="text-lg font-bold text-white">1,250 <span className="text-xs text-[#ff7a18]">coins</span></p>
            </div>
          </div>
        </div>
        <div className="space-y-3">
          {items.length === 0 ? (
            <p className="text-center text-sm text-gray-500">No rewards added yet.</p>
          ) : items.map((r: any, i: number) => {
            const Icon = REWARD_ICONS[i % REWARD_ICONS.length];
            return (
              <div key={i} className="flex items-center gap-3 rounded-lg border border-gray-800 bg-[#161616] p-3">
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-[#ff7a18]/10">
                  <Icon className="h-4 w-4 text-[#ff7a18]" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-white">{r.title || 'Untitled'}</h3>
                  <p className="text-xs text-gray-400 truncate">{r.description || ''}</p>
                </div>
                {r.coins && (
                  <span className="shrink-0 rounded-full bg-[#ff7a18]/10 px-2 py-0.5 text-xs font-semibold text-[#ff7a18]">
                    {r.coins}
                  </span>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ── Main Page ────────────────────────────────────────────────────────────────
export default function AdminHomepagePage() {
  const [tab, setTab] = useState<Tab>('hero');
  const [sections, setSections] = useState<Record<string, any>>({});
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    api.get<Record<string, any>>('/site/frontpage').then((r) => {
      setSections(r.data || {});
    }).catch(() => toast.error('Failed to load homepage data'));
  }, []);

  function setSection(key: string, data: any) {
    setSections((prev) => ({ ...prev, [key]: data }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.put(`/site/admin/frontpage/${tab}`, sections[tab] || {});
      toast.success(`${tab.charAt(0).toUpperCase() + tab.slice(1)} section saved`);
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Homepage Editor</h1>
          <p className="mt-1 text-sm text-gray-400">Edit your landing page content. Changes are reflected on the public homepage.</p>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => setShowPreview(!showPreview)}
          className="gap-2"
        >
          {showPreview ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          {showPreview ? 'Hide Preview' : 'Preview'}
        </Button>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 rounded-xl bg-white/[0.03] p-1 border border-white/10">
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex-1 rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              tab === t.key ? 'bg-[#ff7a18]/20 text-[#ff7a18]' : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            {t.label}
          </button>
        ))}
      </div>

      {/* Editor */}
      <div className="rounded-2xl border border-white/10 bg-white/5 p-6">
        {tab === 'hero' && <HeroEditor data={sections.hero || {}} setData={(d) => setSection('hero', d)} />}
        {tab === 'stats' && <StatsEditor data={sections.stats || {}} setData={(d) => setSection('stats', d)} />}
        {tab === 'features' && <FeaturesEditor data={sections.features || {}} setData={(d) => setSection('features', d)} />}
        {tab === 'rewards' && <RewardsEditor data={sections.rewards || {}} setData={(d) => setSection('rewards', d)} />}

        <Button onClick={save} className="mt-6 w-full" disabled={saving}>
          {saving ? 'Saving…' : `Save ${TABS.find((t) => t.key === tab)?.label}`}
        </Button>
      </div>

      {/* Live Preview */}
      {showPreview && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Eye className="h-4 w-4 text-[#ff7a18]" />
            <h2 className="text-sm font-semibold text-gray-300">Live Preview — {TABS.find((t) => t.key === tab)?.label}</h2>
          </div>
          <div className="overflow-hidden rounded-2xl border border-white/10">
            {tab === 'hero' && <HeroPreview data={sections.hero || {}} />}
            {tab === 'stats' && <StatsPreview data={sections.stats || {}} />}
            {tab === 'features' && <FeaturesPreview data={sections.features || {}} />}
            {tab === 'rewards' && <RewardsPreview data={sections.rewards || {}} />}
          </div>
        </div>
      )}
    </div>
  );
}
