'use client';

import { MessageCircle, X } from 'lucide-react';
import { AnimatePresence, motion } from 'framer-motion';
import { CollapsibleChatPanel } from '@/components/astrology/CollapsibleChatPanel';
import type { BirthChartData } from '@/types/astrology';
import type { AtmospherePacket } from '@/lib/atmosphere/types';

interface OracleChatDrawerProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
  birthChart?: BirthChartData;
  userId: string;
  onUserMessageSent?: (message: string) => void;
  mbtiType?: string;
  clarityMode?: boolean;
  onClarityChange?: () => void;
  draftPrompt?: string;
  draftPromptKey?: number;
  draftLabel?: string;
  atmospherePacket?: AtmospherePacket | null;
  dualPersonality?: {
    core?: string;
    mask?: string;
    final?: string;
  } | null;
}

export function OracleChatDrawer({
  isOpen,
  onOpenChange,
  birthChart,
  userId,
  onUserMessageSent,
  mbtiType,
  clarityMode,
  onClarityChange,
  draftPrompt,
  draftPromptKey,
  draftLabel,
  atmospherePacket,
  dualPersonality,
}: OracleChatDrawerProps) {
  const weatherLabel = atmospherePacket?.tone?.label;
  const weatherPct =
    typeof atmospherePacket?.intensity === 'number' ? `${atmospherePacket.intensity}%` : null;

  return (
    <>
      <AnimatePresence>
        {isOpen ? (
          <>
            <motion.button
              type="button"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => onOpenChange(false)}
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:pointer-events-none lg:bg-transparent lg:backdrop-blur-none"
              aria-label="Close Oracle Chat"
            />

            <motion.aside
              initial={{ opacity: 0, x: 420 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 420 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-sky-500/30 bg-slate-950/95 shadow-2xl shadow-sky-950/40 backdrop-blur-md"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-sky-500/25 px-4 py-3">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-sky-100">Oracle</p>
                    <p className="text-xs text-sky-300/70">Core self + today&apos;s life weather</p>
                    <div className="mt-1.5 flex flex-wrap gap-1">
                      {dualPersonality?.core ? (
                        <span className="rounded-full border border-violet-400/30 bg-violet-500/15 px-2 py-0.5 text-[10px] font-semibold text-violet-100">
                          Core {dualPersonality.core}
                        </span>
                      ) : null}
                      {dualPersonality?.mask &&
                      dualPersonality.mask !== dualPersonality.core ? (
                        <span className="rounded-full border border-orange-400/30 bg-orange-500/15 px-2 py-0.5 text-[10px] font-semibold text-orange-100">
                          Mask {dualPersonality.mask}
                        </span>
                      ) : null}
                      {weatherLabel ? (
                        <span className="rounded-full border border-sky-400/30 bg-sky-500/15 px-2 py-0.5 text-[10px] font-semibold text-sky-100">
                          {weatherLabel}
                          {weatherPct ? ` · ${weatherPct}` : ''}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-200"
                    aria-label="Close chat drawer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="min-h-0 flex-1">
                  <CollapsibleChatPanel
                    birthChart={birthChart}
                    userId={userId}
                    isExpanded
                    showExpandToggle={false}
                    onUserMessageSent={onUserMessageSent}
                    mbtiType={
                      dualPersonality?.final || dualPersonality?.core || mbtiType
                    }
                    clarityMode={clarityMode}
                    onClarityChange={onClarityChange}
                    draftPrompt={draftPrompt}
                    draftPromptKey={draftPromptKey}
                    draftLabel={draftLabel}
                    atmospherePacket={atmospherePacket}
                    dualPersonality={dualPersonality}
                  />
                </div>
              </div>
            </motion.aside>
          </>
        ) : null}
      </AnimatePresence>

      {!isOpen ? (
        <motion.button
          type="button"
          onClick={() => onOpenChange(true)}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full border border-sky-400/40 bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-sky-900/40 transition hover:bg-sky-500"
          aria-label="Open Oracle Chat"
        >
          <MessageCircle className="h-5 w-5" />
          Oracle
          {weatherLabel ? (
            <span className="hidden rounded-full bg-black/20 px-2 py-0.5 text-[10px] font-medium sm:inline">
              {weatherLabel}
            </span>
          ) : null}
        </motion.button>
      ) : null}
    </>
  );
}