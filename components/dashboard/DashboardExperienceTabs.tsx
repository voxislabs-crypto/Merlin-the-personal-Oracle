'use client';

import { CalendarDays, Compass, Hash, Heart, Home } from 'lucide-react';

export type DashboardExperienceTab = 'home' | 'chart' | 'relationships' | 'forecast' | 'numerology';

interface DashboardExperienceTabsProps {
  activeTab: DashboardExperienceTab;
  onTabChange: (tab: DashboardExperienceTab) => void;
}

const TABS: Array<{
  key: DashboardExperienceTab;
  label: string;
  shortLabel: string;
  icon: typeof Home;
}> = [
  { key: 'home', label: 'Home', shortLabel: 'Now', icon: Home },
  { key: 'chart', label: 'My Chart', shortLabel: 'Self', icon: Compass },
  { key: 'relationships', label: 'Relationships', shortLabel: 'Bond', icon: Heart },
  { key: 'forecast', label: 'Forecast & Radar', shortLabel: 'Future', icon: CalendarDays },
  { key: 'numerology', label: 'Numerology', shortLabel: 'Numbers', icon: Hash },
];

export function DashboardExperienceTabs({ activeTab, onTabChange }: DashboardExperienceTabsProps) {
  return (
    <nav
      aria-label="Dashboard sections"
      className="sticky top-0 z-40 -mx-1 mb-6 rounded-2xl border border-slate-700/50 bg-slate-950/85 p-1.5 backdrop-blur-md"
    >
      <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-3 lg:grid-cols-5">
        {TABS.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.key;
          return (
            <button
              key={tab.key}
              type="button"
              onClick={() => onTabChange(tab.key)}
              className={`flex items-center justify-center gap-2 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                isActive
                  ? 'bg-gradient-to-r from-amber-500/25 to-violet-500/20 border border-amber-400/40 text-amber-50 shadow-lg shadow-amber-500/10'
                  : 'border border-transparent text-slate-300 hover:bg-slate-800/70 hover:text-white'
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.shortLabel}</span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}