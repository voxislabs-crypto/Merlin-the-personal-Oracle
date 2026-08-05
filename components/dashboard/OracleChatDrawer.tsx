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
              className="fixed inset-0 z-40 bg-black/50 backdrop-blur-[2px] lg:bg-black/30"
              aria-label="Close Oracle Chat"
            />

            <motion.aside
              initial={{ opacity: 0, x: 420 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 420 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 flex h-full w-full max-w-lg flex-col border-l border-slate-700/80 bg-slate-950 shadow-2xl"
            >
              {/* Single slim chrome — panel owns the conversation surface */}
              <div className="flex shrink-0 items-center justify-between border-b border-slate-800 px-3 py-2.5">
                <p className="text-sm font-semibold text-slate-100">Merlin</p>
                <button
                  type="button"
                  onClick={() => onOpenChange(false)}
                  className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-800 hover:text-slate-100"
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
                  chrome="minimal"
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
          Ask Merlin
        </motion.button>
      ) : null}
    </>
  );
}