'use client';

import { useCallback, useEffect, useState } from 'react';
import { getLocalCalendarDate, isValidCalendarDate } from '@/lib/datetime/local-calendar';
import {
  readOrHydrateWeatherWindowSnapshot,
  readWeatherLandVote,
  writeWeatherLandVote,
  yesterdayCalendarDate,
  type WeatherLandVote,
  type WeatherWindowSnapshot,
} from '@/lib/atmosphere/window-land';

export function YesterdayLandCheck({
  userId,
  today,
}: {
  userId?: string | null;
  today?: string;
}) {
  const todayDate = isValidCalendarDate(today) ? today : getLocalCalendarDate();
  const yesterday = yesterdayCalendarDate(todayDate);
  const [vote, setVote] = useState<WeatherLandVote | null>(null);
  const [snapshot, setSnapshot] = useState<WeatherWindowSnapshot | null>(null);
  const [ready, setReady] = useState(false);
  const [justSaved, setJustSaved] = useState(false);

  useEffect(() => {
    setSnapshot(readOrHydrateWeatherWindowSnapshot(yesterday, userId));
    setVote(readWeatherLandVote(yesterday, userId));
    setReady(true);
  }, [yesterday, userId]);

  const submit = useCallback(
    async (next: WeatherLandVote) => {
      if (vote) return;
      setVote(next);
      writeWeatherLandVote(yesterday, next, userId);
      setJustSaved(true);
      window.setTimeout(() => setJustSaved(false), 1800);

      if (userId) {
        try {
          await fetch('/api/resonance-feedback', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              userId,
              aspectId: `weather-window-${yesterday}`,
              theme: 'life-weather',
              feedback: {
                resonated: next === 'landed',
                accuracyScore: next === 'landed' ? 0.85 : 0.25,
                notes: `Yesterday's weather ${next}${snapshot?.move ? `: ${snapshot.move}` : ''}`,
              },
            }),
          });
        } catch {
          // local vote still counts
        }
      }
    },
    [snapshot?.move, userId, vote, yesterday],
  );

  if (!ready || !snapshot || vote) {
    if (vote && justSaved) {
      return (
        <p className="text-xs text-emerald-300/90">
          Logged. Merlin will weight the next {snapshot?.themeLabel || 'window'} off that.
        </p>
      );
    }
    return null;
  }

  return (
    <div
      className="rounded-xl border border-white/10 bg-black/25 px-3.5 py-3"
      role="group"
      aria-label="Yesterday's weather window"
    >
      <p className="text-[10px] uppercase tracking-[0.22em] text-slate-500">Yesterday’s window</p>
      <p className="mt-1 text-sm text-slate-200">
        Did yesterday’s read match how the day actually felt?
      </p>
      {snapshot.move ? (
        <p className="mt-1 text-xs text-slate-400 line-clamp-2">Move was: {snapshot.move}</p>
      ) : null}
      <div className="mt-2.5 flex flex-wrap gap-2">
        <button
          type="button"
          onClick={() => void submit('landed')}
          className="rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1.5 text-xs font-semibold text-emerald-100 hover:bg-emerald-500/20"
        >
          It landed
        </button>
        <button
          type="button"
          onClick={() => void submit('missed')}
          className="rounded-full border border-slate-500/40 bg-slate-800/60 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-700/70"
        >
          It missed
        </button>
      </div>
    </div>
  );
}
