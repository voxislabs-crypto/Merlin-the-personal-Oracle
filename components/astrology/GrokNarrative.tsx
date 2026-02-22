'use client';

import { useEffect, useMemo, useState } from 'react';
import { ReadAloudButton } from '@/components/astrology/ReadAloud';
import { BirthChartData, BirthData } from '@/components/astrology/BirthChartCalculator';
import { LifeTimeline } from '@/lib/astrology/life-timeline-engine';
import { TransitData } from '@/hooks/useTransits';

interface GrokNarrativeProps {
  mode: 'grok' | 'traditional';
  birthData: BirthData | null;
  chartData: BirthChartData | null;
  lifeArc: LifeTimeline | null;
  transits: TransitData | null;
}

interface GrokNarrativeResponse {
  narrative: string;
  cached?: boolean;
  interpreter?: 'grok' | 'traditional';
}

export function GrokNarrative({ mode, birthData, chartData, lifeArc, transits }: GrokNarrativeProps) {
  const [narrative, setNarrative] = useState<GrokNarrativeResponse | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!birthData || !chartData) return;

    let active = true;
    setLoading(true);

    fetch('/api/grok-narrative', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        mode,
        birthData,
        chartData,
        lifeArc,
        transits,
      }),
    })
      .then((res) => res.json())
      .then((result) => {
        if (!active) return;
        if (result?.success) {
          setNarrative({
            narrative: result.data.narrative,
            cached: result.cached,
            interpreter: result.interpreter,
          });
          return;
        }
        setNarrative({ narrative: 'No narrative available right now.', interpreter: mode });
      })
      .catch(() => {
        if (!active) return;
        setNarrative({
          narrative:
            "The world sees your solar fire first, but your inner weather moves deeper and quieter. The next chapter asks for courage and tenderness at the same time—keep both.",
          interpreter: 'traditional',
        });
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [mode, birthData, chartData, lifeArc, transits]);

  const paragraphs = useMemo(() => {
    if (!narrative?.narrative) return [];
    return narrative.narrative
      .split(/\n\n+/)
      .map((p) => p.trim())
      .filter(Boolean);
  }, [narrative]);

  if (!birthData || !chartData) {
    return null;
  }

  return (
    <div className="rounded-lg border border-purple-500/20 bg-slate-900/40 p-5 space-y-4">
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h3 className="text-lg font-semibold text-purple-200">Narrative Layer</h3>
        <div className="flex items-center gap-2">
          <span className={`text-xs px-2 py-1 rounded border ${mode === 'grok' ? 'text-purple-300 border-purple-500/40' : 'text-amber-300 border-amber-500/40'}`}>
            {mode === 'grok' ? "Grok'd" : 'Traditional'}
          </span>
          {narrative?.cached && (
            <span className="text-xs px-2 py-1 rounded border border-emerald-500/40 text-emerald-300">Cached</span>
          )}
          {narrative?.narrative && <ReadAloudButton text={narrative.narrative} label="Grok Read-Aloud" priority={mode === 'grok'} />}
        </div>
      </div>

      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-full bg-slate-700/60 rounded" />
          <div className="h-3 w-5/6 bg-slate-700/60 rounded" />
          <div className="h-3 w-2/3 bg-slate-700/60 rounded" />
        </div>
      ) : (
        <div className="space-y-3">
          {paragraphs.map((paragraph, index) => (
            <p key={index} className="text-slate-200 leading-relaxed">
              {paragraph}
            </p>
          ))}
        </div>
      )}
    </div>
  );
}
