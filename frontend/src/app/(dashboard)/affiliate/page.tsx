'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Copy, Users, DollarSign, Clock, Link2, TrendingUp, ShoppingCart } from 'lucide-react';

interface AffiliateSettings {
  enabled: boolean;
  commissionPercent: number;
  discountPercent: number;
  discordClaimRequired: boolean;
  discordServerUrl: string | null;
}

interface ReferralEntry {
  id: number;
  email: string;
  commissionEarned: number;
  planName: string | null;
  date: string;
}

interface ReferralStats {
  referralCount: number;
  totalEarned: number;
  referrals: ReferralEntry[];
}

export default function AffiliatePage() {
  const [settings, setSettings] = useState<AffiliateSettings | null>(null);
  const [myCode, setMyCode] = useState<string | null>(null);
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [referralInput, setReferralInput] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    api.get<AffiliateSettings>('/affiliate/settings').then((r) => setSettings(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    if (settings?.enabled) {
      api.get<{ code: string }>('/affiliate/my-code').then((r) => setMyCode(r.data.code)).catch(() => {});
      api.get<ReferralStats>('/affiliate/my-stats').then((r) => setStats(r.data)).catch(() => {});
    }
  }, [settings?.enabled]);

  async function copyCode() {
    if (!myCode) return;
    const url = `${window.location.origin}/login?ref=${myCode}`;
    await navigator.clipboard.writeText(url);
    toast.success('Referral link copied!');
  }

  async function applyCode() {
    if (!referralInput.trim()) return;
    setApplying(true);
    try {
      await api.post('/affiliate/apply', { code: referralInput.trim() });
      toast.success('Referral linked successfully!');
      setReferralInput('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Failed to apply referral');
    } finally {
      setApplying(false);
    }
  }

  // Coming Soon state
  if (settings && !settings.enabled) {
    return (
      <div className="mx-auto max-w-lg space-y-8 py-8 px-4">
        <div>
          <h1 className="text-2xl font-bold text-white">Affiliate Program</h1>
          <p className="mt-1 text-sm text-gray-400">Earn commissions by inviting friends.</p>
        </div>
        <div className="rounded-2xl border border-[#ff7a18]/20 bg-[#ff7a18]/[0.04] p-12 text-center">
          <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#ff7a18]/10">
            <Clock className="h-8 w-8 text-[#ff7a18]" />
          </div>
          <h2 className="text-xl font-bold text-white">Coming Soon</h2>
          <p className="mt-2 text-sm text-gray-400">
            Our affiliate program is being set up. Check back soon!
          </p>
        </div>
      </div>
    );
  }

  if (!settings) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/20 border-t-[#ff7a18]" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6 py-8 px-4">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-white">Affiliate Program</h1>
        <p className="mt-1 text-sm text-gray-400">
          Earn <span className="font-semibold text-green-400">{settings.commissionPercent}% commission</span> every
          time someone you refer purchases a paid plan.
          {settings.discountPercent > 0 && (
            <> They also get <span className="font-semibold text-blue-400">{settings.discountPercent}% off</span>!</>
          )}
        </p>
      </div>

      {/* How it works banner */}
      <div className="rounded-2xl border border-[#ff7a18]/20 bg-gradient-to-r from-[#ff7a18]/[0.06] to-transparent p-5">
        <h3 className="mb-3 text-sm font-semibold uppercase tracking-wider text-[#ff7a18]">How It Works</h3>
        <div className="grid gap-4 sm:grid-cols-3">
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff7a18]/10 text-sm font-bold text-[#ff7a18]">1</div>
            <p className="text-sm text-gray-300">Share your unique referral link with friends</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff7a18]/10 text-sm font-bold text-[#ff7a18]">2</div>
            <p className="text-sm text-gray-300">They sign up and purchase a paid plan</p>
          </div>
          <div className="flex items-start gap-3">
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-[#ff7a18]/10 text-sm font-bold text-[#ff7a18]">3</div>
            <p className="text-sm text-gray-300">You earn {settings.commissionPercent}% of every purchase as balance</p>
          </div>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10">
            <Users className="h-5 w-5 text-blue-400" />
          </div>
          <p className="text-2xl font-bold text-white">{stats?.referralCount ?? 0}</p>
          <p className="text-xs text-gray-400 mt-0.5">Commission Records</p>
        </div>
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.03] p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-green-500/10">
            <DollarSign className="h-5 w-5 text-green-400" />
          </div>
          <p className="text-2xl font-bold text-green-400">₹{stats?.totalEarned?.toFixed(2) ?? '0.00'}</p>
          <p className="text-xs text-gray-400 mt-0.5">Total Earned</p>
        </div>
        <div className="rounded-2xl border border-[#ff7a18]/20 bg-[#ff7a18]/[0.03] p-5">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-xl bg-[#ff7a18]/10">
            <TrendingUp className="h-5 w-5 text-[#ff7a18]" />
          </div>
          <p className="text-2xl font-bold text-[#ff7a18]">{settings.commissionPercent}%</p>
          <p className="text-xs text-gray-400 mt-0.5">Commission Rate</p>
        </div>
      </div>

      {/* Referral Link */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <div className="mb-3 flex items-center gap-2">
          <Link2 className="h-4 w-4 text-gray-400" />
          <h2 className="text-sm font-semibold text-white">Your Referral Link</h2>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex-1 truncate rounded-lg border border-white/10 bg-black/40 px-3 py-2.5 font-mono text-sm text-gray-300">
            {myCode ? `${typeof window !== 'undefined' ? window.location.origin : ''}/login?ref=${myCode}` : 'Loading…'}
          </div>
          <Button onClick={copyCode} disabled={!myCode} size="sm" className="shrink-0 gap-2">
            <Copy className="h-4 w-4" /> Copy
          </Button>
        </div>
      </div>

      {/* Apply Referral Code */}
      <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
        <h2 className="mb-1 text-sm font-semibold text-white">Apply a Referral Code</h2>
        <p className="mb-4 text-xs text-gray-400">Were you referred by a friend? Enter their code to link your account.</p>
        <div className="flex gap-3">
          <Input
            placeholder="Enter referral code"
            value={referralInput}
            onChange={(e) => setReferralInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && applyCode()}
          />
          <Button onClick={applyCode} disabled={applying || !referralInput.trim()} className="shrink-0">
            {applying ? 'Applying…' : 'Apply'}
          </Button>
        </div>
      </div>

      {/* Discord Claim Notice */}
      {settings.discordClaimRequired && settings.discordServerUrl && (
        <div className="rounded-2xl border border-[#5865F2]/20 bg-[#5865F2]/[0.04] p-5 text-center">
          <p className="text-sm text-gray-300">
            To withdraw your affiliate earnings, please join our Discord server and create a ticket.
          </p>
          <a href={settings.discordServerUrl} target="_blank" rel="noopener noreferrer" className="mt-3 inline-block">
            <Button variant="secondary" className="gap-2 bg-[#5865F2]/90 hover:bg-[#5865F2] text-white border-[#5865F2]/50">
              Join Discord
            </Button>
          </a>
        </div>
      )}

      {/* Commission History */}
      {stats && stats.referrals.length > 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-5">
          <div className="mb-4 flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-gray-400" />
            <h2 className="text-sm font-semibold text-white">Commission History</h2>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10 text-left text-xs text-gray-500">
                  <th className="pb-2 pr-4 font-medium">Referred User</th>
                  <th className="pb-2 pr-4 font-medium">Plan</th>
                  <th className="pb-2 pr-4 font-medium">Commission</th>
                  <th className="pb-2 font-medium">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/[0.04]">
                {stats.referrals.map((r) => (
                  <tr key={r.id} className="hover:bg-white/[0.02]">
                    <td className="py-2.5 pr-4 text-gray-300">{r.email}</td>
                    <td className="py-2.5 pr-4">
                      <span className="rounded-md bg-white/[0.06] px-2 py-0.5 text-xs text-gray-300">
                        {r.planName || 'N/A'}
                      </span>
                    </td>
                    <td className="py-2.5 pr-4 font-medium text-green-400">+₹{r.commissionEarned.toFixed(2)}</td>
                    <td className="py-2.5 text-xs text-gray-500">{new Date(r.date).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Empty state for history */}
      {stats && stats.referrals.length === 0 && (
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.02] p-8 text-center">
          <ShoppingCart className="mx-auto mb-3 h-8 w-8 text-gray-600" />
          <p className="text-sm text-gray-400">No commissions yet. Share your link to start earning!</p>
        </div>
      )}
    </div>
  );
}
