'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { MessageCircle } from 'lucide-react';

interface SiteSettings {
  discordInviteUrl?: string;
  discordPopupEnabled?: boolean;
}

export function DiscordJoinPopup() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');

  useEffect(() => {
    const dismissed = sessionStorage.getItem('discord_popup_dismissed');
    if (dismissed) return;

    api.get<SiteSettings>('/site/settings').then((r) => {
      if (r.data?.discordPopupEnabled && r.data?.discordInviteUrl) {
        setUrl(r.data.discordInviteUrl);
        setOpen(true);
      }
    }).catch(() => {});
  }, []);

  function dismiss() {
    sessionStorage.setItem('discord_popup_dismissed', '1');
    setOpen(false);
  }

  function joinAndDismiss() {
    window.open(url, '_blank', 'noopener');
    dismiss();
  }

  if (!open) return null;

  return (
    <Modal open={open} onClose={dismiss}>
      <div className="mx-auto w-full max-w-sm rounded-2xl border border-[#5865F2]/30 bg-[#161616] p-8 text-center">
        <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[#5865F2]/10">
          <MessageCircle className="h-8 w-8 text-[#5865F2]" />
        </div>
        <h2 className="text-xl font-bold text-white">Join Our Discord!</h2>
        <p className="mt-2 text-sm text-gray-400">
          Join our Discord community for support, announcements, and exclusive giveaways before you register.
        </p>
        <div className="mt-6 flex flex-col gap-3">
          <Button
            onClick={joinAndDismiss}
            className="w-full gap-2 bg-[#5865F2] hover:bg-[#4752C4] text-white"
          >
            <MessageCircle className="h-4 w-4" />
            Join Discord Server
          </Button>
          <button onClick={dismiss} className="text-sm text-gray-500 hover:text-gray-300 transition-colors">
            Maybe later
          </button>
        </div>
      </div>
    </Modal>
  );
}
