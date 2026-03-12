'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Scroll, RefreshCw, CheckCircle2, Circle, Zap, ChevronDown, ChevronUp, Flame, Brain, Heart, Ghost, Star } from 'lucide-react';
import { readJsonResponse, resolveApiUrl } from '@/lib/api-client';
import { generateQuestsFromInputs, type Quest } from '@/lib/astrology/quest-generation';

interface QuestLogProps {
  enabled: boolean;
  chartData?: unknown;
  transits?: unknown;
  forecast?: unknown;
  mbtiType?: string;
  userId?: string;
}

const STORAGE_KEY = 'merlin_quests';

const CATEGORY_META: Record<string, { label: string; Icon: React.ComponentType<{ className?: string }>; color: string }> = {
  mind: { label: 'Mind', Icon: Brain, color: 'text-sky-400' },
  heart: { label: 'Heart', Icon: Heart, color: 'text-rose-400' },
  body: { label: 'Body', Icon: Flame, color: 'text-orange-400' },
  spirit: { label: 'Spirit', Icon: Star, color: 'text-yellow-300' },
  shadow: { label: 'Shadow', Icon: Ghost, color: 'text-purple-400' },
};

const DIFFICULTY_LABEL: Record<number, string> = { 1: 'Daily', 2: 'Weekly', 3: 'Deep Work' };

export default function QuestLog({ enabled, chartData, transits, forecast, mbtiType, userId }: QuestLogProps) {
  const [quests, setQuests] = useState<Quest[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [totalXp, setTotalXp] = useState(0);

  // Load persisted quests on mount
  useEffect(() => {
    const loadFromStorage = () => {
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed: Quest[] = JSON.parse(stored);
          setQuests(parsed);
          setTotalXp(parsed.filter(q => q.completed).reduce((sum, q) => sum + q.xp, 0));
        }
      } catch {
        // ignore
      }
    };
    loadFromStorage();

    // Listen for storage events fired when chat saves a tactic as a quest
    const onStorage = (e: StorageEvent) => {
      if (e.key === STORAGE_KEY) loadFromStorage();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, []);

  const persistQuests = (updated: Quest[]) => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const generateQuests = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(resolveApiUrl('/api/quests'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chartData, transits, forecast, mbtiType }),
      });

      const json = await readJsonResponse<{ success: boolean; error?: string; data?: { quests: Quest[] } }>(
        res,
        'Quest generation API'
      );

      if (!json.success) throw new Error(json.error || 'Unknown error');
      const freshQuests: Quest[] = json.data.quests.map((q: Quest) => ({ ...q, completed: false }));
      setQuests(freshQuests);
      setTotalXp(0);
      persistQuests(freshQuests);
    } catch (e: unknown) {
      const fallbackQuests = generateQuestsFromInputs({ transits, forecast, mbtiType }).map((quest) => ({
        ...quest,
        completed: false,
      }));

      if (fallbackQuests.length > 0) {
        setQuests(fallbackQuests);
        setTotalXp(0);
        persistQuests(fallbackQuests);
        setError(null);
      } else {
        setError(e instanceof Error ? e.message : 'Failed to generate quests');
      }
    } finally {
      setLoading(false);
    }
  }, [chartData, transits, forecast, mbtiType]);

  // Auto-generate when first enabled and no quests
  useEffect(() => {
    if (enabled && quests.length === 0 && !loading) {
      generateQuests();
    }
  }, [enabled]); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleComplete = (id: string) => {
    setQuests(prev => {
      const updated = prev.map(q => {
        if (q.id !== id) return q;
        const wasCompleted = q.completed;
        return { ...q, completed: !wasCompleted };
      });
      const xp = updated.filter(q => q.completed).reduce((sum, q) => sum + q.xp, 0);
      setTotalXp(xp);
      persistQuests(updated);
      return updated;
    });
  };

  if (!enabled) return null;

  const completed = quests.filter(q => q.completed).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="mt-4 rounded-2xl border border-yellow-500/20 bg-slate-900/80 backdrop-blur-sm overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-yellow-500/10">
        <div className="flex items-center gap-2">
          <Scroll className="w-4 h-4 text-yellow-400" />
          <span className="text-yellow-300 font-semibold text-sm tracking-wide">Quest Log</span>
          {quests.length > 0 && (
            <span className="ml-2 text-xs text-slate-400">
              {completed}/{quests.length} complete
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {totalXp > 0 && (
            <span className="text-xs font-bold text-yellow-400 flex items-center gap-1">
              <Zap className="w-3 h-3" /> {totalXp} XP
            </span>
          )}
          <button
            onClick={generateQuests}
            disabled={loading}
            className="flex items-center gap-1 text-xs text-slate-400 hover:text-yellow-300 transition-colors disabled:opacity-40"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            {loading ? 'Summoning…' : 'New Quests'}
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="px-4 py-3 space-y-2">
        {error && (
          <p className="text-xs text-red-400 px-1">{error}</p>
        )}

        {loading && quests.length === 0 && (
          <div className="py-6 text-center text-slate-500 text-sm">
            <RefreshCw className="w-5 h-5 mx-auto mb-2 animate-spin text-yellow-500/50" />
            Merlin is reading the sky…
          </div>
        )}

        <AnimatePresence initial={false}>
          {quests.map((quest, i) => {
            const meta = CATEGORY_META[quest.category] ?? CATEGORY_META.spirit;
            const { Icon } = meta;
            const isExpanded = expanded === quest.id;

            return (
              <motion.div
                key={quest.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ delay: i * 0.04 }}
                className={`rounded-xl border transition-colors ${
                  quest.completed
                    ? 'border-slate-700/40 bg-slate-800/30 opacity-60'
                    : 'border-slate-700/60 bg-slate-800/50 hover:border-yellow-500/30'
                }`}
              >
                <div
                  className="flex items-start gap-3 px-4 py-3 cursor-pointer select-none"
                  onClick={() => setExpanded(isExpanded ? null : quest.id)}
                >
                  {/* Completion toggle */}
                  <button
                    onClick={e => { e.stopPropagation(); toggleComplete(quest.id); }}
                    className="mt-0.5 flex-shrink-0"
                  >
                    {quest.completed
                      ? <CheckCircle2 className="w-4 h-4 text-yellow-400" />
                      : <Circle className="w-4 h-4 text-slate-500 hover:text-yellow-400 transition-colors" />
                    }
                  </button>

                  {/* Category icon */}
                  <Icon className={`w-4 h-4 flex-shrink-0 mt-0.5 ${meta.color}`} />

                  {/* Title + meta */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm font-medium leading-snug ${quest.completed ? 'line-through text-slate-500' : 'text-slate-200'}`}>
                        {quest.title}
                      </p>
                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <span className="text-xs text-slate-500">{DIFFICULTY_LABEL[quest.difficulty]}</span>
                        <span className="text-xs font-semibold text-yellow-500/80">+{quest.xp}xp</span>
                        {isExpanded
                          ? <ChevronUp className="w-3 h-3 text-slate-500" />
                          : <ChevronDown className="w-3 h-3 text-slate-500" />
                        }
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expanded description */}
                <AnimatePresence>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-11 pb-3 space-y-1.5">
                        <p className="text-sm text-slate-400 leading-relaxed">{quest.description}</p>
                        <p className="text-xs text-slate-600 italic">↑ {quest.cosmicSource}</p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </AnimatePresence>

        {/* Progress bar */}
        {quests.length > 0 && (
          <div className="pt-1 pb-0.5">
            <div className="h-1 rounded-full bg-slate-800 overflow-hidden">
              <motion.div
                className="h-full bg-gradient-to-r from-yellow-500 to-amber-400 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: `${(completed / quests.length) * 100}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}
