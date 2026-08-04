'use client';

import { Compass, Eye, MessageCircle, Theater } from 'lucide-react';
import { getMBTITypeDescription, type MBTIType } from '@/lib/mbti-overlay';
import {
  ActiveStorylinePanel,
  type StorylineTheme,
  type StorylineWindow,
} from '@/components/dashboard/ActiveStorylinePanel';
import { ArcanePane } from '@/components/dashboard/ArcanePane';

interface ChartIdentityBriefProps {
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  /** @deprecated use mbtiCore — kept for single-type fallback */
  mbtiType?: string;
  /** Inner core (firmware) — who you are inside */
  mbtiCore?: string;
  /** Outer mask (hardware) — how you often present */
  mbtiMask?: string;
  /** Integrated engine read */
  mbtiFinal?: string;
  /** Blend headline / combined interpretation when dual layers differ */
  blendHeadline?: string;
  blendSummary?: string;
  dayRating?: string;
  /**
   * Active transit / confluence blurb (NOT natal identity) — fallback prose.
   */
  activeStoryline?: string;
  /** Structured confluence themes (preferred over prose) */
  storylineThemes?: StorylineTheme[] | null;
  storylineWindows?: StorylineWindow[] | null;
  headline?: string;
  onAskMerlin?: () => void;
  /** Discuss dual MBTI / personality layers with the Oracle */
  onAskPersonality?: () => void;
  /** Discuss the active storyline / timing windows */
  onAskStoryline?: () => void;
  onAskStorylineTheme?: (title: string) => void;
  onAskStorylineWindow?: (title: string) => void;
}

function typeBlurb(type?: string): string | null {
  if (!type || type.length !== 4) return null;
  try {
    return getMBTITypeDescription(type.toUpperCase() as MBTIType);
  } catch {
    return null;
  }
}

export function ChartIdentityBrief({
  sunSign,
  moonSign,
  risingSign,
  mbtiType,
  mbtiCore,
  mbtiMask,
  mbtiFinal,
  blendHeadline,
  blendSummary,
  dayRating,
  activeStoryline,
  storylineThemes,
  storylineWindows,
  headline,
  onAskMerlin,
  onAskPersonality,
  onAskStoryline,
  onAskStorylineTheme,
  onAskStorylineWindow,
}: ChartIdentityBriefProps) {
  const placements = [
    sunSign ? `Sun ${sunSign}` : null,
    moonSign ? `Moon ${moonSign}` : null,
    risingSign ? `Rising ${risingSign}` : null,
  ].filter(Boolean);

  const core = (mbtiCore || mbtiType || '').toUpperCase() || undefined;
  const mask = (mbtiMask || '').toUpperCase() || undefined;
  const finalType = (mbtiFinal || core || '').toUpperCase() || undefined;
  const dual = Boolean(core && mask && core !== mask);
  const same = Boolean(core && mask && core === mask);
  const coreBlurb = typeBlurb(core);
  const maskBlurb = typeBlurb(mask);

  const hasStorylineUi =
    Boolean(activeStoryline?.trim()) ||
    Boolean(storylineThemes?.length) ||
    Boolean(storylineWindows?.length);

  const natalHeadline =
    headline &&
    !headline.toLowerCase().includes('strongest storyline') &&
    !headline.toLowerCase().includes('clearest timing')
      ? headline
      : undefined;

  return (
    <ArcanePane
      tone="amber"
      shellClassName="border-amber-400/30 bg-gradient-to-br from-amber-950/35 via-slate-950/70 to-violet-950/30"
      padding="p-5 md:p-6"
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
        <div className="flex items-start gap-3">
          <div className="rounded-xl border border-amber-400/30 bg-black/20 p-3">
            <Compass className="h-6 w-6 text-amber-200" />
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.28em] text-amber-200/75">Self · identity</p>
            <h2 className="mt-1 text-xl md:text-2xl font-bold text-amber-50">Who you are in this weather</h2>
            <p className="mt-1 text-xs text-slate-400">
              Birth chart + dual personality — core first, mask second when they differ.
            </p>
            {placements.length ? (
              <p className="mt-2 text-sm text-slate-300">{placements.join(' · ')}</p>
            ) : null}
            {/* Day rating is weather, not identity — omit from Self hero unless explicitly useful later */}
          </div>
        </div>
        {onAskMerlin ? (
          <button
            type="button"
            onClick={onAskMerlin}
            className="inline-flex items-center gap-2 self-start rounded-full border border-cyan-300/35 bg-cyan-500/10 px-4 py-2 text-sm font-semibold text-cyan-100 hover:bg-cyan-500/20"
          >
            <MessageCircle className="h-4 w-4" />
            Explain my chart
          </button>
        ) : null}
      </div>

      {/* Personality: Core first */}
      {core || mask ? (
        <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">Personality from your chart</p>
            {onAskPersonality ? (
              <button
                type="button"
                onClick={onAskPersonality}
                className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100 hover:bg-violet-500/25 transition-colors"
              >
                <MessageCircle className="h-3.5 w-3.5" />
                Ask Merlin about my type
              </button>
            ) : null}
          </div>

          <div
            className={
              dual
                ? 'grid grid-cols-1 sm:grid-cols-2 gap-3'
                : 'grid grid-cols-1 gap-3'
            }
          >
            {core ? (
              <div className="rounded-xl border border-violet-400/30 bg-violet-500/10 px-3.5 py-3 h-full">
                <div className="flex items-start gap-2">
                  <Eye className="h-4 w-4 text-violet-300 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-violet-300/80 font-semibold">
                      Core · inside
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-violet-50">{core}</p>
                    {coreBlurb ? (
                      <p className="mt-1 text-xs sm:text-sm text-violet-100/85 leading-snug">{coreBlurb}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}

            {mask && dual ? (
              <div className="rounded-xl border border-orange-400/25 bg-orange-500/10 px-3.5 py-3 h-full">
                <div className="flex items-start gap-2">
                  <Theater className="h-4 w-4 text-orange-300 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[10px] uppercase tracking-[0.2em] text-orange-300/80 font-semibold">
                      Mask · present
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-orange-50">{mask}</p>
                    {maskBlurb ? (
                      <p className="mt-1 text-xs sm:text-sm text-orange-100/85 leading-snug">{maskBlurb}</p>
                    ) : null}
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {same && mask ? (
            <p className="text-xs text-slate-400">
              Mask and core agree — what people see matches your inner type ({core}).
            </p>
          ) : null}

          {dual && (blendHeadline || blendSummary) ? (
            <div className="rounded-xl border border-amber-400/25 bg-amber-500/10 px-4 py-3">
              <p className="text-[10px] uppercase tracking-[0.2em] text-amber-300/80 font-semibold">
                Combined read
              </p>
              {blendHeadline ? (
                <p className="mt-1 text-sm font-semibold text-amber-50">{blendHeadline}</p>
              ) : null}
              {blendSummary ? (
                <p className="mt-1.5 text-sm leading-relaxed text-slate-200">{blendSummary}</p>
              ) : null}
              {finalType ? (
                <p className="mt-2 text-xs text-amber-200/70">
                  Integrated type Merlin uses for weather tone:{' '}
                  <span className="font-semibold text-amber-100">{finalType}</span>
                  {typeBlurb(finalType) ? ` — ${typeBlurb(finalType)}` : ''}
                </p>
              ) : null}
              {onAskPersonality ? (
                <button
                  type="button"
                  onClick={onAskPersonality}
                  className="mt-3 inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Talk this through with Merlin
                </button>
              ) : null}
            </div>
          ) : null}

          {!dual && core && onAskPersonality ? (
            <button
              type="button"
              onClick={onAskPersonality}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-cyan-200 hover:text-cyan-100"
            >
              <MessageCircle className="h-3.5 w-3.5" />
              Discuss {core} with Merlin
            </button>
          ) : null}

          {!dual && core && !mask ? (
            <p className="text-xs text-slate-400">
              Single-layer read for now. Full mask/core split appears when dual overlay is ready.
            </p>
          ) : null}
        </div>
      ) : null}

      {/* Active transit storyline — visual cards when data exists */}
      {hasStorylineUi ? (
        <div className="mt-4">
          <ActiveStorylinePanel
            themes={storylineThemes}
            windows={storylineWindows}
            fallbackText={activeStoryline}
            onAskStoryline={onAskStoryline}
            onAskTheme={onAskStorylineTheme}
            onAskWindow={onAskStorylineWindow}
          />
        </div>
      ) : null}

      {natalHeadline ? (
        <p className="mt-4 text-sm md:text-base leading-relaxed text-slate-200 border-t border-white/10 pt-4">
          {natalHeadline}
        </p>
      ) : null}
    </ArcanePane>
  );
}
