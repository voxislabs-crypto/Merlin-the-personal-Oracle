'use client';

import { useState } from 'react';
import { Check, Copy, Share2 } from 'lucide-react';
import {
  buildShareWeatherText,
  shareWeatherText,
  type ShareWeatherPayload,
} from '@/lib/share-weather';
import { cn } from '@/lib/utils';

export interface ShareWeatherButtonProps {
  payload: ShareWeatherPayload;
  className?: string;
  /** Compact icon-only */
  compact?: boolean;
  label?: string;
}

/**
 * One-tap share for product-led growth (native share or copy to clipboard).
 */
export function ShareWeatherButton({
  payload,
  className = '',
  compact = false,
  label = 'Share today',
}: ShareWeatherButtonProps) {
  const [status, setStatus] = useState<'idle' | 'copied' | 'shared' | 'error'>('idle');

  const onShare = async () => {
    const result = await shareWeatherText(payload);
    if (result.method === 'native') {
      setStatus('shared');
    } else if (result.method === 'clipboard') {
      setStatus('copied');
    } else {
      // Last resort: select-able prompt
      try {
        window.prompt('Copy your life weather share text:', buildShareWeatherText(payload));
        setStatus('copied');
      } catch {
        setStatus('error');
      }
    }
    window.setTimeout(() => setStatus('idle'), 2200);
  };

  const statusLabel =
    status === 'copied'
      ? 'Copied!'
      : status === 'shared'
        ? 'Shared'
        : status === 'error'
          ? 'Try again'
          : label;

  return (
    <button
      type="button"
      onClick={() => void onShare()}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-full border border-white/20 bg-white/5 px-3 py-2 text-xs font-semibold text-slate-100 transition hover:bg-white/10 hover:border-white/30',
        compact && 'px-2.5',
        status === 'copied' && 'border-emerald-400/40 text-emerald-200',
        className
      )}
      title="Share or copy your life weather (great for stories / group chats)"
    >
      {status === 'copied' || status === 'shared' ? (
        <Check className="h-3.5 w-3.5" />
      ) : status === 'idle' ? (
        <Share2 className="h-3.5 w-3.5" />
      ) : (
        <Copy className="h-3.5 w-3.5" />
      )}
      {!compact ? <span>{statusLabel}</span> : null}
    </button>
  );
}
