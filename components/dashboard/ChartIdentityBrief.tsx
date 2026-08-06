'use client';

import { Compass, Eye, MessageCircle, Sparkles, Theater } from 'lucide-react';
import { getMBTITypeDescription, type MBTIType } from '@/lib/mbti-overlay';
import {
  ActiveStorylinePanel,
  type StorylineTheme,
  type StorylineWindow,
} from '@/components/dashboard/ActiveStorylinePanel';
import { ArcanePane } from '@/components/dashboard/ArcanePane';
import { DefaultOperatingSystem } from '@/components/dashboard/DefaultOperatingSystem';
import type { IdentityEdgeTakeaway, IdentityOperatingTrait } from '@/lib/self/types';

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
  /** Highlighted memorable takeaway (preferred over plain blend paragraph) */
  edgeTakeaway?: IdentityEdgeTakeaway | null;
  /** Evergreen OS traits — global identity contract */
  operatingSystem?: IdentityOperatingTrait[];
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
  edgeTakeaway,
  operatingSystem = [],
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

  const edgeBody = edgeTakeaway?.body || (dual || same ? blendSummary : null);
  const edgeTitle = edgeTakeaway?.title || 'Your edge';

  return (
    <div className="space-y-5">
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
              <h2 className="mt-1 text-xl font-bold text-amber-50 md:text-2xl">Who you are</h2>
              <p className="mt-1 text-xs text-slate-400">
                Stable self first — weather and storylines shift; this map doesn&apos;t.
              </p>
              {placements.length ? (
                <p className="mt-2 text-sm text-slate-300">{placements.join(' · ')}</p>
              ) : null}
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

        {/* Memorable synthesis — shareable takeaway */}
        {edgeBody ? (
          <div className="relative mt-5 overflow-hidden rounded-2xl border-2 border-amber-300/45 bg-gradient-to-br from-amber-500/20 via-violet-600/15 to-black/40 px-4 py-4 shadow-[0_0_32px_rgba(251,191,36,0.12)] md:px-5 md:py-5">
            <div
              className="pointer-events-none absolute inset-x-0 top-0 h-px"
              style={{
                background:
                  'linear-gradient(90deg, transparent, rgba(251,191,36,0.55), transparent)',
              }}
            />
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-amber-300/40 bg-amber-500/20">
                <Sparkles className="h-5 w-5 text-amber-100" />
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase tracking-[0.22em] text-amber-200/90">
                  {edgeTitle}
                </p>
                {blendHeadline && dual ? (
                  <p className="mt-1 text-xs font-medium text-amber-100/70">{blendHeadline}</p>
                ) : null}
                <p className="mt-2 text-base font-semibold leading-snug tracking-tight text-white md:text-lg">
                  {edgeBody}
                </p>
                {finalType ? (
                  <p className="mt-2 text-xs text-amber-200/65">
                    Integrated type for weather tone:{' '}
                    <span className="font-semibold text-amber-100">{finalType}</span>
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
            </div>
          </div>
        ) : null}

        {/* Personality: Core first */}
        {core || mask ? (
          <div className="mt-5 space-y-3 border-t border-white/10 pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <p className="text-[10px] uppercase tracking-[0.24em] text-slate-500">
                Personality from your chart
              </p>
              {onAskPersonality ? (
                <button
                  type="button"
                  onClick={onAskPersonality}
                  className="inline-flex items-center gap-1.5 rounded-full border border-violet-300/40 bg-violet-500/15 px-3 py-1.5 text-xs font-semibold text-violet-100 transition-colors hover:bg-violet-500/25"
                >
                  <MessageCircle className="h-3.5 w-3.5" />
                  Ask Merlin about my type
                </button>
              ) : null}
            </div>

            <div
              className={
                dual ? 'grid grid-cols-1 gap-3 sm:grid-cols-2' : 'grid grid-cols-1 gap-3'
              }
            >
              {core ? (
                <div className="h-full rounded-xl border border-violet-400/30 bg-violet-500/10 px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <Eye className="mt-0.5 h-4 w-4 shrink-0 text-violet-300" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-violet-300/80">
                        Core · inside
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-violet-50">{core}</p>
                      {coreBlurb ? (
                        <p className="mt-1 text-xs leading-snug text-violet-100/85 sm:text-sm">
                          {coreBlurb}
                        </p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {mask && dual ? (
                <div className="h-full rounded-xl border border-orange-400/25 bg-orange-500/10 px-3.5 py-3">
                  <div className="flex items-start gap-2">
                    <Theater className="mt-0.5 h-4 w-4 shrink-0 text-orange-300" />
                    <div className="min-w-0">
                      <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-orange-300/80">
                        Mask · present
                      </p>
                      <p className="mt-0.5 text-lg font-bold text-orange-50">{mask}</p>
                      {maskBlurb ? (
                        <p className="mt-1 text-xs leading-snug text-orange-100/85 sm:text-sm">
                          {maskBlurb}
                        </p>
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

            {!dual && core && !mask ? (
              <p className="text-xs text-slate-400">
                Single-layer read for now. Full mask/core split appears when dual overlay is ready.
              </p>
            ) : null}
          </div>
        ) : null}

        {natalHeadline ? (
          <p className="mt-4 border-t border-white/10 pt-4 text-sm leading-relaxed text-slate-300 md:text-base">
            {natalHeadline}
          </p>
        ) : null}
      </ArcanePane>

      {/* Evergreen OS — global identity, not weather */}
      {operatingSystem.length > 0 ? (
        <DefaultOperatingSystem traits={operatingSystem} />
      ) : null}

      {/* Dynamic: active transit storyline */}
      {hasStorylineUi ? (
        <ActiveStorylinePanel
          themes={storylineThemes}
          windows={storylineWindows}
          fallbackText={activeStoryline}
          onAskStoryline={onAskStoryline}
          onAskTheme={onAskStorylineTheme}
          onAskWindow={onAskStorylineWindow}
        />
      ) : null}
    </div>
  );
}
