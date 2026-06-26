'use client';

import type { Ref } from 'react';
import { DailyForecast } from '@/components/astrology/DailyForecast';
import { ContextualHelp } from '@/components/dashboard/ContextualHelp';
import type { DayRating } from '@/lib/dashboard/cosmic-rating';

interface PredictiveSnapshot {
  lunarPhase?: string;
  lunarActionBias?: string;
  progressedMoonSign?: string;
  progressedMoonDegree?: number;
  topSignal?: string;
  actionHint?: {
    label: string;
    reason: string;
    className: string;
  };
}

interface ForecastDetailsSectionProps {
  sectionRef?: Ref<HTMLDivElement>;
  expanded: boolean;
  onExpandedChange: (expanded: boolean) => void;
  date: string;
  summary: string;
  planetaryHighlights: string[];
  moonPhase: string;
  moonSign?: string;
  sunSign?: string;
  transits: unknown[];
  day_rating?: DayRating | string;
  focusAreas?: unknown;
  timingWindows?: unknown;
  futureSignals?: unknown;
  conversationalPrompts?: unknown;
  advice: string;
  loading: boolean;
  userId?: string;
  onAskContext: (label: string, prompt: string) => void;
  selectedContextLabel?: string;
  explainability?: unknown;
  domainScores?: unknown;
  insightLoading?: boolean;
  insightError?: string;
  predictiveSnapshot?: PredictiveSnapshot;
  helpText?: string;
  subtitle?: string;
}

export function ForecastDetailsSection({
  sectionRef,
  expanded,
  onExpandedChange,
  date,
  summary,
  planetaryHighlights,
  moonPhase,
  moonSign,
  sunSign,
  transits,
  day_rating,
  focusAreas,
  timingWindows,
  futureSignals,
  conversationalPrompts,
  advice,
  loading,
  userId,
  onAskContext,
  selectedContextLabel,
  explainability,
  domainScores,
  insightLoading,
  insightError,
  predictiveSnapshot,
  helpText = 'Tabbed breakdown: overview, life areas, timing, and sky — expand when you want more than the daily story.',
  subtitle,
}: ForecastDetailsSectionProps) {
  const displaySubtitle =
    subtitle ||
    `Today · ${date ? new Date(date.includes('T') ? date : `${date}T12:00:00`).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric' })}`;

  return (
    <div ref={sectionRef} className="space-y-4">
      <div className="mb-4 flex w-full items-center justify-between gap-3 rounded-xl border border-purple-400/20 bg-slate-900/50 px-4 py-3 hover:border-purple-400/35 transition-colors">
        <div
          className="min-w-0 flex-1 cursor-pointer text-left"
          onClick={() => onExpandedChange(!expanded)}
          onKeyDown={(event) => {
            if (event.key === 'Enter' || event.key === ' ') {
              event.preventDefault();
              onExpandedChange(!expanded);
            }
          }}
          role="button"
          tabIndex={0}
          aria-expanded={expanded}
        >
          <h2 className="text-lg font-semibold text-purple-200 flex items-center gap-2">
            Forecast details
            <span
              className="inline-flex"
              onClick={(event) => event.stopPropagation()}
              onPointerDown={(event) => event.stopPropagation()}
              onKeyDown={(event) => event.stopPropagation()}
            >
              <ContextualHelp label={helpText} />
            </span>
          </h2>
          <p className="mt-0.5 text-sm text-slate-400">{displaySubtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => onExpandedChange(!expanded)}
          className="shrink-0 rounded-lg border border-purple-400/25 bg-purple-500/10 px-3 py-1.5 text-xs font-semibold uppercase tracking-wider text-purple-200 hover:bg-purple-500/20"
        >
          {expanded ? 'Collapse' : 'Expand'}
        </button>
      </div>

      {expanded ? (
        <div className="rounded-xl border border-purple-500/20 bg-slate-900/40 p-4 md:p-5 backdrop-blur-sm">
          <DailyForecast
            date={date}
            summary={summary}
            planetaryHighlights={planetaryHighlights}
            moonPhase={moonPhase}
            moonSign={moonSign}
            sunSign={sunSign}
            transits={transits as never[]}
            day_rating={day_rating as DayRating}
            focusAreas={focusAreas as never}
            timingWindows={timingWindows as never}
            futureSignals={futureSignals as never}
            conversationalPrompts={conversationalPrompts as never}
            advice={advice}
            loading={loading}
            userId={userId}
            onAskContext={onAskContext}
            selectedContextLabel={selectedContextLabel}
            explainability={explainability as never}
            domainScores={domainScores as never}
            insightLoading={insightLoading}
            insightError={insightError}
            hideHeader
            hideStory
            variant="grouped"
            predictiveSnapshot={predictiveSnapshot}
          />
        </div>
      ) : null}
    </div>
  );
}