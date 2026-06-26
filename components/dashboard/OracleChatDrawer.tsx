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
              className="fixed inset-0 z-40 bg-black/40 backdrop-blur-sm lg:bg-transparent lg:backdrop-blur-none lg:pointer-events-none"
              aria-label="Close Oracle Chat"
            />

            <motion.aside
              initial={{ opacity: 0, x: 420 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 420 }}
              transition={{ type: 'spring', damping: 28, stiffness: 320 }}
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md border-l border-purple-500/25 bg-slate-950/95 shadow-2xl"
            >
              <div className="flex h-full flex-col">
                <div className="flex items-center justify-between border-b border-purple-500/20 px-4 py-3">
                  <div>
                    <p className="text-sm font-semibold text-purple-200">Oracle Chat</p>
                    <p className="text-xs text-purple-400">Dedicated conversational view</p>
                  </div>
                  <button
                    type="button"
                    onClick={() => onOpenChange(false)}
                    className="rounded-lg p-2 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition"
                    aria-label="Close chat drawer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
                <div className="flex-1 min-h-0">
                  <CollapsibleChatPanel
                    birthChart={birthChart}
                    userId={userId}
                    isExpanded
                    showExpandToggle={false}
                    onUserMessageSent={onUserMessageSent}
                    mbtiType={mbtiType}
                    clarityMode={clarityMode}
                    onClarityChange={onClarityChange}
                    draftPrompt={draftPrompt}
                    draftPromptKey={draftPromptKey}
                    draftLabel={draftLabel}
                    atmospherePacket={atmospherePacket}
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
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 rounded-full bg-purple-600 px-4 py-3 text-sm font-semibold text-white shadow-lg hover:bg-purple-700 transition"
          aria-label="Open Oracle Chat"
        >
          <MessageCircle className="h-5 w-5" />
          Oracle Chat
        </motion.button>
      ) : null}
    </>
  );
}