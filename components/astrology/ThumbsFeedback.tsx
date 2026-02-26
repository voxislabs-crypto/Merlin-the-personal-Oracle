'use client';

import React, { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ThumbsUp, ThumbsDown, Check } from 'lucide-react';

interface ThumbsFeedbackProps {
  /** Unique ID for this piece of content (e.g. "planet-Sun", "transit-0", "chart-summary") */
  itemId: string;
  /** Short label for the feedback context — used for logging */
  label?: string;
  /** Clerk userId — if omitted feedback only persists to localStorage */
  userId?: string;
  /** Optional theme tag for resonanceDB learning */
  theme?: string;
}

type Vote = 'up' | 'down' | null;

const STORAGE_PREFIX = 'merlin_feedback_';

/**
 * Compact inline thumbs up / down feedback.
 * Persists to localStorage immediately; also fires to resonanceDB when userId is present.
 */
export function ThumbsFeedback({ itemId, label = 'insight', userId, theme = 'general' }: ThumbsFeedbackProps) {
  const storageKey = `${STORAGE_PREFIX}${itemId}`;
  const [vote, setVote] = useState<Vote>(null);
  const [saved, setSaved] = useState(false);

  // Hydrate from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(storageKey);
      if (stored === 'up' || stored === 'down') setVote(stored);
    } catch { /* no-op */ }
  }, [storageKey]);

  const handleVote = useCallback(async (v: 'up' | 'down') => {
    if (vote !== null) return; // one-shot

    setVote(v);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);

    // Persist locally
    try { localStorage.setItem(storageKey, v); } catch { /* no-op */ }

    // Fire to resonanceDB in background when userId available
    if (userId) {
      try {
        const { resonanceDB } = await import('@/lib/resonance-database');
        await resonanceDB.processFeedback(userId, itemId, theme, {
          resonated: v === 'up',
          accuracyScore: v === 'up' ? 0.85 : 0.25,
        });
      } catch (e) {
        console.warn('[ThumbsFeedback] resonanceDB unavailable:', e);
      }
    }
  }, [vote, storageKey, userId, itemId, theme]);

  return (
    <span className="inline-flex items-center gap-1 ml-2 align-middle">
      <AnimatePresence mode="wait">
        {saved ? (
          <motion.span
            key="saved"
            initial={{ opacity: 0, scale: 0.7 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.7 }}
            className="inline-flex items-center gap-0.5 text-xs text-emerald-400"
          >
            <Check className="w-3 h-3" />
            <span>noted</span>
          </motion.span>
        ) : (
          <motion.span
            key="buttons"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="inline-flex items-center gap-0.5"
          >
            <button
              onClick={() => handleVote('up')}
              disabled={vote !== null}
              title={`This ${label} resonated with me`}
              className={`p-0.5 rounded transition-all ${
                vote === 'up'
                  ? 'text-emerald-400'
                  : vote === 'down'
                  ? 'text-slate-600 cursor-default'
                  : 'text-slate-500 hover:text-emerald-400 hover:scale-110'
              }`}
            >
              <ThumbsUp className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => handleVote('down')}
              disabled={vote !== null}
              title={`This ${label} didn't resonate`}
              className={`p-0.5 rounded transition-all ${
                vote === 'down'
                  ? 'text-red-400'
                  : vote === 'up'
                  ? 'text-slate-600 cursor-default'
                  : 'text-slate-500 hover:text-red-400 hover:scale-110'
              }`}
            >
              <ThumbsDown className="w-3.5 h-3.5" />
            </button>
          </motion.span>
        )}
      </AnimatePresence>
    </span>
  );
}

export default ThumbsFeedback;
