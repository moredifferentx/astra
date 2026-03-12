'use client';

import { useEffect, useState } from 'react';
import { toast } from 'sonner';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';

interface AffiliateSettings {
  id?: number;
  enabled: boolean;
  commissionPercent: number;
  discountPercent: number;
  discordClaimRequired: boolean;
  discordServerUrl: string;
}

const defaults: AffiliateSettings = {
  enabled: false,
  commissionPercent: 10,
  discountPercent: 0,
  discordClaimRequired: false,
  discordServerUrl: '',
};

export default function AdminAffiliatePage() {
  const [settings, setSettings] = useState<AffiliateSettings>(defaults);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api.get<AffiliateSettings>('/affiliate/settings').then((r) => {
      if (r.data) setSettings({ ...defaults, ...r.data });
    }).catch(() => {});
  }, []);

  function handleChange(key: keyof AffiliateSettings, value: string | boolean | number) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  async function save() {
    setSaving(true);
    try {
      await api.put('/affiliate/admin/settings', settings);
      toast.success('Affiliate settings saved');
    } catch {
      toast.error('Failed to save');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-8 py-8">
      <h1 className="text-2xl font-bold">Affiliate / Referral Settings</h1>

      <div className="space-y-6 rounded-2xl border border-white/10 bg-white/5 p-6">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.enabled}
            onChange={(e) => handleChange('enabled', e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#ff7a18] focus:ring-[#ff7a18]"
          />
          <span className="text-sm font-medium text-gray-300">Enable Affiliate System</span>
        </label>

        <Input
          label="Commission Percent (%)"
          type="number"
          min="0"
          max="100"
          value={String(settings.commissionPercent)}
          onChange={(e) => handleChange('commissionPercent', parseInt(e.target.value) || 0)}
        />
        <p className="text-xs text-gray-500 -mt-4">Percentage of paid plan price the referrer earns as balance credit.</p>

        <Input
          label="Discount Percent for Referred Users (%)"
          type="number"
          min="0"
          max="100"
          value={String(settings.discountPercent)}
          onChange={(e) => handleChange('discountPercent', parseInt(e.target.value) || 0)}
        />

        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={settings.discordClaimRequired}
            onChange={(e) => handleChange('discordClaimRequired', e.target.checked)}
            className="h-4 w-4 rounded border-white/20 bg-white/5 text-[#ff7a18] focus:ring-[#ff7a18]"
          />
          <span className="text-sm text-gray-300">Require Discord join to withdraw earnings</span>
        </label>

        <Input
          label="Discord Server URL"
          value={settings.discordServerUrl}
          onChange={(e) => handleChange('discordServerUrl', e.target.value)}
          placeholder="https://discord.gg/..."
        />

        <Button onClick={save} className="w-full" disabled={saving}>
          {saving ? 'Saving…' : 'Save Settings'}
        </Button>
      </div>
    </div>
  );
}
