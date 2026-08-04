'use client';

import { useState } from 'react';
import { CalendarDays, CloudSun, Compass, Hash, Heart, ChevronDown } from 'lucide-react';
import { arcaneChromeClass } from '@/components/dashboard/ArcanePane';

/**
 * Stable tab keys (avoid big-bang route renames).
 * Product pillars: Life weather (primary) vs Self (depth).
 * Bonds / Numbers are discoverable secondary Self surfaces — not equal peers.
 * @see docs/TWO_PILLARS.md
 */
export type DashboardExperienceTab = 'home' | 'chart' | 'relationships' | 'forecast' | 'numerology';

export type DashboardPillar = 'sky' | 'self';

interface DashboardExperienceTabsProps {
  activeTab: DashboardExperienceTab;
  onTabChange: (tab: DashboardExperienceTab) => void;
}

const WEATHER_TABS: Array<{
  key: DashboardExperienceTab;
  label: string;
  shortLabel: string;
  icon: typeof CloudSun;
}> = [
  { key: 'home', label: 'Today', shortLabel: 'Today', icon: CloudSun },
  { key: 'forecast', label: 'Forecast', shortLabel: 'Radar', icon: CalendarDays },
];

const SELF_PRIMARY = {
  key: 'chart' as const,
  label: 'You',
  shortLabel: 'You',
  icon: Compass,
};

const SELF_SECONDARY: Array<{
  key: DashboardExperienceTab;
  label: string;
  shortLabel: string;
  icon: typeof Heart;
  blurb: string;
}> = [
  { key: 'relationships', label: 'Bonds', shortLabel: 'Bonds', icon: Heart, blurb: 'Synastry & patterns' },
  { key: 'numerology', label: 'Numbers', shortLabel: 'Nums', icon: Hash, blurb: 'Life path & cycles' },
];

function weatherTabClass(isActive: boolean) {
  if (isActive) {
    return 'bg-gradient-to-r from-sky-500/25 to-cyan-500/15 border border-sky-400/45 text-sky-50 shadow-lg shadow-sky-500/10';
  }
  return 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white';
}

function selfTabClass(isActive: boolean) {
  if (isActive) {
    return 'bg-gradient-to-r from-amber-500/25 to-violet-500/20 border border-amber-400/40 text-amber-50 shadow-lg shadow-amber-500/10';
  }
  return 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white';
}

export function DashboardExperienceTabs({ activeTab, onTabChange }: DashboardExperienceTabsProps) {
  const secondaryActive = SELF_SECONDARY.some((t) => t.key === activeTab);
  const [moreOpen, setMoreOpen] = useState(secondaryActive);

  return (
    <nav
      aria-label="Merlin pillars — life weather and Self identity"
      className={`sticky top-0 z-40 -mx-1 mb-6 rounded-2xl p-2 ${arcaneChromeClass('neutral')}`}
    >
      <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
        {/* Life weather — primary sell */}
        <div
          className={`rounded-xl border p-1.5 ${
            WEATHER_TABS.some((t) => t.key === activeTab)
              ? 'border-sky-500/35 bg-sky-950/25'
              : 'border-slate-700/40 bg-slate-900/40'
          }`}
        >
          <div className="mb-1.5 flex items-baseline justify-between px-2 pt-0.5">
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-sky-200/90">
                Weather
              </span>
              <span className="rounded-full border border-sky-400/30 bg-sky-500/10 px-1.5 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-sky-200/80">
                Primary
              </span>
            </div>
            <span className="text-[10px] text-slate-500">Life weather</span>
          </div>
          <div className="grid grid-cols-2 gap-1.5">
            {WEATHER_TABS.map((tab) => {
              const Icon = tab.icon;
              const isActive = activeTab === tab.key;
              return (
                <button
                  key={tab.key}
                  type="button"
                  onClick={() => onTabChange(tab.key)}
                  className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${weatherTabClass(
                    isActive,
                  )}`}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  <span className="hidden sm:inline">{tab.label}</span>
                  <span className="sm:hidden">{tab.shortLabel}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Self — You primary; Bonds/Numbers discoverable */}
        <div
          className={`rounded-xl border p-1.5 ${
            activeTab === 'chart' || secondaryActive
              ? 'border-amber-500/30 bg-amber-950/20'
              : 'border-slate-700/40 bg-slate-900/40'
          }`}
        >
          <div className="mb-1.5 flex items-baseline justify-between px-2 pt-0.5">
            <span className="text-[10px] font-bold uppercase tracking-[0.28em] text-amber-200/90">
              Self
            </span>
            <span className="text-[10px] text-slate-500">Who you are</span>
          </div>
          <div className="grid grid-cols-[1fr_auto] gap-1.5">
            <button
              type="button"
              onClick={() => onTabChange(SELF_PRIMARY.key)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${selfTabClass(
                activeTab === 'chart',
              )}`}
            >
              <Compass className="h-4 w-4 shrink-0" />
              <span>{SELF_PRIMARY.label}</span>
            </button>
            <button
              type="button"
              onClick={() => setMoreOpen((o) => !o)}
              className={`flex items-center justify-center gap-1 rounded-xl px-3 py-2.5 text-xs font-semibold transition ${
                secondaryActive
                  ? 'border border-amber-400/40 bg-amber-500/15 text-amber-100'
                  : 'border border-slate-600/50 text-slate-400 hover:bg-slate-800/70 hover:text-slate-200'
              }`}
              aria-expanded={moreOpen || secondaryActive}
              title="Bonds, Numbers, and other Self depth"
            >
              More
              <ChevronDown
                className={`h-3.5 w-3.5 transition-transform ${moreOpen || secondaryActive ? 'rotate-180' : ''}`}
              />
            </button>
          </div>
          {(moreOpen || secondaryActive) && (
            <div className="mt-1.5 grid grid-cols-2 gap-1.5 border-t border-white/5 pt-1.5">
              {SELF_SECONDARY.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.key;
                return (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => onTabChange(tab.key)}
                    className={`flex flex-col items-start gap-0.5 rounded-lg px-3 py-2 text-left transition ${
                      isActive
                        ? 'border border-amber-400/40 bg-amber-500/15 text-amber-50'
                        : 'border border-transparent text-slate-400 hover:bg-slate-800/60 hover:text-slate-200'
                    }`}
                  >
                    <span className="flex items-center gap-1.5 text-xs font-semibold">
                      <Icon className="h-3.5 w-3.5" />
                      {tab.label}
                    </span>
                    <span className="text-[10px] text-slate-500">{tab.blurb}</span>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
