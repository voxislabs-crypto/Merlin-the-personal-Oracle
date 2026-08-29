'use client';

import { useState } from 'react';
import { CalendarDays, CloudSun, Compass, Hash, Heart, ChevronDown } from 'lucide-react';
import { arcaneChromeClass } from '@/components/dashboard/ArcanePane';

/**
 * Three primary pillars always visible: Weather · Forecast · You.
 * Bonds / Numbers stay under You → More.
 */
export type DashboardExperienceTab = 'home' | 'chart' | 'relationships' | 'forecast' | 'numerology';

export type DashboardPillar = 'sky' | 'self';

interface DashboardExperienceTabsProps {
  activeTab: DashboardExperienceTab;
  onTabChange: (tab: DashboardExperienceTab) => void;
}

const PRIMARY: Array<{
  key: DashboardExperienceTab;
  pillar: 'weather' | 'you';
  label: string;
  icon: typeof CloudSun;
}> = [
  { key: 'home', pillar: 'weather', label: 'Weather', icon: CloudSun },
  { key: 'forecast', pillar: 'weather', label: 'Forecast', icon: CalendarDays },
  { key: 'chart', pillar: 'you', label: 'You', icon: Compass },
];

const SELF_SECONDARY: Array<{
  key: DashboardExperienceTab;
  label: string;
  icon: typeof Heart;
  blurb: string;
}> = [
  { key: 'relationships', label: 'Bonds', icon: Heart, blurb: 'Synastry & patterns' },
  { key: 'numerology', label: 'Numbers', icon: Hash, blurb: 'Life path & cycles' },
];

function primaryClass(isActive: boolean, pillar: 'weather' | 'you') {
  if (isActive && pillar === 'you') {
    return 'bg-gradient-to-r from-amber-500/25 to-violet-500/20 border border-amber-400/45 text-amber-50 shadow-lg shadow-amber-500/10';
  }
  if (isActive) {
    return 'bg-gradient-to-r from-sky-500/25 to-cyan-500/15 border border-sky-400/45 text-sky-50 shadow-lg shadow-sky-500/10';
  }
  return 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white';
}

export function DashboardExperienceTabs({ activeTab, onTabChange }: DashboardExperienceTabsProps) {
  const secondaryActive = SELF_SECONDARY.some((t) => t.key === activeTab);
  const [moreOpen, setMoreOpen] = useState(secondaryActive);

  return (
    <nav
      aria-label="Merlin pillars — Weather, Forecast, and You"
      className={`sticky top-0 z-50 -mx-1 mb-6 rounded-2xl p-2 ${arcaneChromeClass('neutral')}`}
    >
      <div className="grid grid-cols-3 gap-1.5">
        {PRIMARY.map((tab) => {
          const Icon = tab.icon;
          const isActive =
            activeTab === tab.key || (tab.key === 'chart' && secondaryActive);
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-3 text-sm font-semibold transition ${primaryClass(
                isActive,
                tab.pillar,
              )}`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span>{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div className="mt-1.5 flex justify-end">
        <button
          type="button"
          onClick={() => setMoreOpen((o) => !o)}
          className={`inline-flex items-center gap-1 rounded-lg px-2.5 py-1 text-[11px] font-semibold transition ${
            secondaryActive
              ? 'border border-amber-400/40 bg-amber-500/15 text-amber-100'
              : 'border border-transparent text-slate-500 hover:text-slate-300'
          }`}
          aria-expanded={moreOpen || secondaryActive}
        >
          More · Bonds & Numbers
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
    </nav>
  );
}
