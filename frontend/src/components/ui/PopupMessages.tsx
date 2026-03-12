'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';
import { Modal } from '@/components/ui/Modal';
import { Button } from '@/components/ui/Button';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';

interface PopupMessage {
  id: number;
  title: string;
  message: string;
  imageUrl: string | null;
  showOnce: boolean;
}

export function PopupMessages() {
  const [popups, setPopups] = useState<PopupMessage[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    api.get<PopupMessage[]>('/site/popups').then((r) => {
      // Filter out already-dismissed popups
      const dismissed = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
      const active = r.data.filter((p) => !p.showOnce || !dismissed.includes(p.id));
      if (active.length > 0) {
        setPopups(active);
        setOpen(true);
      }
    }).catch(() => {});
  }, []);

  function dismiss() {
    const current = popups[currentIndex];
    if (current?.showOnce) {
      const dismissed = JSON.parse(localStorage.getItem('dismissed_popups') || '[]');
      dismissed.push(current.id);
      localStorage.setItem('dismissed_popups', JSON.stringify(dismissed));
    }

    if (currentIndex < popups.length - 1) {
      setCurrentIndex((i) => i + 1);
    } else {
      setOpen(false);
    }
  }

  if (!open || popups.length === 0) return null;

  const current = popups[currentIndex];

  return (
    <Modal open={open} onClose={dismiss}>
      <div className="relative mx-auto w-full max-w-md rounded-2xl border border-white/10 bg-[#161616] p-0 overflow-hidden">
        {/* Close button */}
        <button
          onClick={dismiss}
          className="absolute right-3 top-3 z-10 rounded-full bg-black/50 p-1.5 text-gray-400 hover:text-white transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Image */}
        {current.imageUrl && (
          <div className="relative w-full aspect-video bg-black/20">
            <img
              src={current.imageUrl}
              alt={current.title}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        {/* Content */}
        <div className="p-6">
          <h2 className="text-lg font-bold text-white">{current.title}</h2>
          <p className="mt-2 text-sm text-gray-400 whitespace-pre-wrap">{current.message}</p>

          {/* Navigation */}
          <div className="mt-6 flex items-center justify-between">
            {popups.length > 1 ? (
              <div className="flex items-center gap-2 text-xs text-gray-500">
                <button
                  onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
                  disabled={currentIndex === 0}
                  className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span>{currentIndex + 1} / {popups.length}</span>
                <button
                  onClick={() => setCurrentIndex((i) => Math.min(popups.length - 1, i + 1))}
                  disabled={currentIndex === popups.length - 1}
                  className="rounded p-1 hover:bg-white/10 disabled:opacity-30"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            ) : (
              <div />
            )}
            <Button onClick={dismiss} size="sm">
              {currentIndex < popups.length - 1 ? 'Next' : 'Got it'}
            </Button>
          </div>
        </div>
      </div>
    </Modal>
  );
}
