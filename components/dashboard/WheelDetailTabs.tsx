'use client';

import { CalendarDays, Sparkles, UserRound } from 'lucide-react';

export type WheelDetailTab = 'astrology' | 'personality' | 'forecast';

interface WheelDetailTabsProps {
  activeTab: WheelDetailTab;
  onTabChange: (tab: WheelDetailTab) => void;
  astrologyPanel: React.ReactNode;
  personalityPanel: React.ReactNode;
  forecastPanel: React.ReactNode;
}

const TABS: Array<{
  key: WheelDetailTab;
  label: string;
  icon: typeof Sparkles;
  description: string;
}> = [
  {
    key: 'astrology',
    label: 'Astrology',
    icon: Sparkles,
    description: 'Placements, houses, and chart details',
  },
  {
    key: 'personality',
    label: 'Personality',
    icon: UserRound,
    description: 'Dual MBTI layers from your chart',
  },
  {
    key: 'forecast',
    label: 'Daily Forecast',
    icon: CalendarDays,
    description: "Today's transits and alerts",
  },
];

export function WheelDetailTabs({
  activeTab,
  onTabChange,
  astrologyPanel,
  personalityPanel,
  forecastPanel,
}: WheelDetailTabsProps) {
  const panel =
    activeTab === 'astrology'
      ? astrologyPanel
      : activeTab === 'personality'
        ? personalityPanel
        : forecastPanel;

  return (
    <div className="mt-6 space-y-4">
      <div
        role="tablist"
        aria-label="Chart detail views"
        className="grid grid-cols-3 gap-2 rounded-xl border border-slate-700/50 bg-slate-950/60 p-1.5"
      >
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              role="tab"
              aria-selected={isActive}
              aria-controls={`wheel-detail-panel-${tab.key}`}
              id={`wheel-detail-tab-${tab.key}`}
              onClick={() => onTabChange(tab.key)}
              className={`flex flex-col items-center gap-1 rounded-lg px-3 py-2.5 text-center transition sm:flex-row sm:justify-center sm:gap-2 ${
                isActive
                  ? 'border border-amber-400/40 bg-gradient-to-r from-amber-500/20 to-violet-500/15 text-amber-50 shadow-md shadow-amber-500/10'
                  : 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="text-xs font-semibold sm:text-sm">{tab.label}</span>
            </button>
          );
        })}
      </div>

      <div
        id={`wheel-detail-panel-${activeTab}`}
        role="tabpanel"
        aria-labelledby={`wheel-detail-tab-${activeTab}`}
        className="min-h-[200px] rounded-xl border border-slate-700/50 bg-slate-900/50 p-5 backdrop-blur-sm"
      >
        {panel}
      </div>
    </div>
  );
}