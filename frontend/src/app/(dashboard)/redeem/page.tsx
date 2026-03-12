'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Gift, Sparkles } from 'lucide-react';

export default function RedeemPage() {
  const [code, setCode] = useState('');
  const [redeeming, setRedeeming] = useState(false);
  const [result, setResult] = useState<{ coinsAwarded: number } | null>(null);

  async function redeem() {
    if (!code.trim()) return;
    setRedeeming(true);
    setResult(null);
    try {
      const r = await api.post<{ coinsAwarded: number }>('/coupons/redeem', { code: code.trim() });
      setResult(r.data);
      toast.success(`+${r.data.coinsAwarded} coins redeemed!`);
      setCode('');
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { message?: string } } })?.response?.data?.message;
      toast.error(msg ?? 'Invalid or expired code');
    } finally {
      setRedeeming(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg space-y-8 py-8">
      <div>
        <h1 className="text-2xl font-bold">Redeem Code</h1>
        <p className="mt-1 text-sm text-gray-400">Enter a coupon or gift code to claim your rewards.</p>
      </div>

      {/* Main card */}
      <div className="rounded-2xl border border-[#ff7a18]/20 bg-gradient-to-b from-[#ff7a18]/[0.04] to-transparent p-8">
        <div className="flex flex-col items-center text-center">
          <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-2xl bg-[#ff7a18]/10">
            <Gift className="h-8 w-8 text-[#ff7a18]" />
          </div>

          <h2 className="text-xl font-bold text-white">Got a code?</h2>
          <p className="mt-2 mb-6 text-sm text-gray-400">
            Coupon codes can be redeemed for free coins. Enter your code below.
          </p>

          <div className="w-full space-y-4">
            <Input
              placeholder="Enter your code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              onKeyDown={(e) => e.key === 'Enter' && redeem()}
              className="text-center text-lg tracking-widest"
            />
            <Button onClick={redeem} disabled={redeeming || !code.trim()} className="w-full gap-2">
              <Sparkles className="h-4 w-4" />
              {redeeming ? 'Redeeming…' : 'Redeem Code'}
            </Button>
          </div>
        </div>
      </div>

      {/* Success animation */}
      {result && (
        <div className="rounded-2xl border border-green-500/20 bg-green-500/[0.04] p-6 text-center animate-in fade-in zoom-in duration-300">
          <p className="text-4xl font-extrabold text-green-400">+{result.coinsAwarded}</p>
          <p className="mt-1 text-sm text-gray-400">coins added to your balance</p>
        </div>
      )}

      <p className="text-center text-xs text-gray-500">
        Codes are case-insensitive and can only be used within their usage limits.
      </p>
    </div>
  );
}
