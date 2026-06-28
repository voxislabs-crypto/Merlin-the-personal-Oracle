'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Settings2 } from 'lucide-react';
import type { DashboardExperienceTab } from '@/components/dashboard/DashboardExperienceTabs';
import {
  MODULE_LABELS,
  type DashboardModuleKey,
  type DashboardModulePreferences,
} from '@/lib/dashboard/module-preferences';

export type ContextNavSection =
  | 'story'
  | 'oracle'
  | 'details'
  | 'ritual'
  | 'wheel'
  | 'placements'
  | 'personality'
  | 'focus'
  | 'deep-dive'
  | 'identity'
  | 'timeline'
  | 'storm'
  | 'analysis'
  | 'prophecy'
  | 'patterns'
  | 'synastry'
  | 'overview'
  | 'numerology-core'
  | 'numerology-cycles'
  | 'numerology-blend';

interface ContextLink {
  key: ContextNavSection;
  label: string;
  title: string;
  visible?: boolean;
}

interface DashboardContextNavProps {
  activeTab: DashboardExperienceTab;
  activeSection: ContextNavSection;
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  onNavigate: (section: ContextNavSection) => void;
  compactMode: boolean;
  onCompactModeChange: (compact: boolean) => void;
  premiumLocked: boolean;
  mbtiType?: string;
  modulePreferences: DashboardModulePreferences;
  onModulePreferencesChange: (prefs: DashboardModulePreferences) => void;
}

const TAB_LINKS: Record<DashboardExperienceTab, ContextLink[]> = {
  home: [
    { key: 'story', label: 'Story', title: 'Today\'s cosmic story' },
    { key: 'oracle', label: 'Oracle', title: 'Merlin adds commentary' },
    { key: 'details', label: 'Details', title: 'Tabbed forecast breakdown' },
    { key: 'ritual', label: 'Ritual', title: 'Daily return loop', visible: true },
  ],
  forecast: [
    { key: 'story', label: 'Brief', title: 'Horizon brief for today' },
    { key: 'oracle', label: 'Oracle', title: 'Merlin commentary' },
    { key: 'details', label: 'Details', title: 'Grouped forecast tabs' },
    { key: 'timeline', label: 'Timeline', title: '7-day timeline and quests' },
    { key: 'storm', label: 'Storm Radar', title: 'Pressure windows ahead' },
    { key: 'analysis', label: 'Analysis', title: 'Transits, life arc, reading' },
    { key: 'prophecy', label: 'Prophecy', title: 'Personal prophecy' },
  ],
  chart: [
    { key: 'overview', label: 'Overview', title: 'Chart identity brief' },
    { key: 'wheel', label: 'Wheel', title: 'Birth chart wheel' },
    { key: 'placements', label: 'Placements', title: 'Planet and sign details' },
    { key: 'personality', label: 'Personality', title: 'Dual MBTI layers' },
    { key: 'focus', label: 'Focus Views', title: 'Dedicated module views' },
    { key: 'deep-dive', label: 'Deep Dive', title: 'Extended chart analysis' },
    { key: 'identity', label: 'Identity', title: 'Archetype and pattern card' },
  ],
  relationships: [
    { key: 'overview', label: 'Overview', title: 'Relationship space intro' },
    { key: 'oracle', label: 'Oracle', title: 'Live relationship signal' },
    { key: 'patterns', label: 'Patterns', title: 'Pattern mirror panel' },
    { key: 'synastry', label: 'Synastry', title: 'Compare charts' },
  ],
  numerology: [
    { key: 'numerology-core', label: 'Core', title: 'Life path and name numbers' },
    { key: 'numerology-cycles', label: 'Cycles', title: 'Personal year, month, and day' },
    { key: 'numerology-blend', label: 'Blend', title: 'Astrology + numerology synthesis' },
  ],
};

function navButtonClass(isActive: boolean) {
  if (isActive) {
    return 'w-full text-left px-2.5 py-1.5 text-xs rounded-md border border-amber-400/50 bg-amber-500/20 text-amber-100 transition';
  }
  return 'w-full text-left px-2.5 py-1.5 text-xs rounded-md bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition';
}

export function DashboardContextNav({
  activeTab,
  activeSection,
  collapsed,
  onCollapsedChange,
  onNavigate,
  compactMode,
  onCompactModeChange,
  premiumLocked,
  mbtiType,
  modulePreferences,
  onModulePreferencesChange,
}: DashboardContextNavProps) {
  const [showModuleSettings, setShowModuleSettings] = useState(false);

  const toggleModule = (key: DashboardModuleKey) => {
    onModulePreferencesChange({
      ...modulePreferences,
      [key]: !modulePreferences[key],
    });
  };

  const links = (TAB_LINKS[activeTab] || []).filter((link) => {
    if (link.key === 'ritual') return modulePreferences.returnLoop;
    if (link.key === 'timeline') return modulePreferences.weeklyForecast;
    if (link.key === 'focus') return modulePreferences.focusViews;
    if (link.key === 'deep-dive') return modulePreferences.deepDive && !compactMode;
    return link.visible !== false;
  });

  const tabLabel =
    activeTab === 'home'
      ? 'Home'
      : activeTab === 'forecast'
        ? 'Forecast'
        : activeTab === 'chart'
          ? 'Chart'
          : 'Relationships';

  return (
    <aside
      className={`hidden lg:block shrink-0 sticky top-24 self-start z-30 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/90 backdrop-blur shadow-lg p-2.5">
        <div className="flex items-center justify-between px-1 mb-2">
          {!collapsed ? (
            <p className="text-[10px] uppercase tracking-wider text-slate-400">{tabLabel} nav</p>
          ) : (
            <span className="text-[10px] uppercase tracking-wider text-slate-500">Nav</span>
          )}
          <button
            type="button"
            onClick={() => onCollapsedChange(!collapsed)}
            title={collapsed ? 'Expand navigator' : 'Collapse navigator'}
            className="text-slate-400 hover:text-slate-200 transition"
          >
            {collapsed ? <ChevronRight className="h-3.5 w-3.5" /> : <ChevronLeft className="h-3.5 w-3.5" />}
          </button>
        </div>

        {!collapsed ? (
          <div className="space-y-3">
            <div className="space-y-1">
              <p className="px-1 text-[10px] uppercase tracking-wider text-slate-500">In this tab</p>
              {links.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  onClick={() => onNavigate(link.key)}
                  className={navButtonClass(activeSection === link.key)}
                  title={link.title}
                >
                  {link.label}
                  {link.key === 'personality' && mbtiType ? ` (${mbtiType})` : ''}
                  {premiumLocked && (link.key === 'analysis' || link.key === 'personality' || link.key === 'focus')
                    ? ' • Locked'
                    : ''}
                </button>
              ))}
            </div>

            <div className="border-t border-white/8 pt-2 space-y-2">
              <button
                type="button"
                onClick={() => onCompactModeChange(!compactMode)}
                title="Hide secondary panels for a focused reading"
                className={`w-full text-left px-2.5 py-1.5 text-xs rounded-md border transition ${
                  compactMode
                    ? 'border-emerald-500/50 text-emerald-200 bg-emerald-500/10'
                    : 'border-slate-600 text-slate-300 bg-slate-800/60 hover:bg-slate-700'
                }`}
              >
                {compactMode ? 'Compact mode: On' : 'Compact mode: Off'}
              </button>

              <button
                type="button"
                onClick={() => setShowModuleSettings((prev) => !prev)}
                className="w-full flex items-center gap-1.5 px-2.5 py-1.5 text-xs rounded-md bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition"
                title="Choose which dashboard modules are visible"
              >
                <Settings2 className="h-3.5 w-3.5" />
                Customize layout
              </button>

              {showModuleSettings ? (
                <div className="rounded-lg border border-white/10 bg-slate-900/80 p-2 space-y-1.5">
                  <p className="text-[10px] uppercase tracking-wider text-slate-500 flex items-center gap-1">
                    <LayoutGrid className="h-3 w-3" />
                    Visible modules
                  </p>
                  {(Object.keys(MODULE_LABELS) as DashboardModuleKey[]).map((key) => (
                    <label
                      key={key}
                      className="flex items-center gap-2 text-[11px] text-slate-300 cursor-pointer hover:text-slate-100"
                    >
                      <input
                        type="checkbox"
                        checked={modulePreferences[key]}
                        onChange={() => toggleModule(key)}
                        className="rounded border-slate-600"
                      />
                      {MODULE_LABELS[key]}
                    </label>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-2 py-1">
            {links.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => onNavigate(link.key)}
                title={link.label}
                className={`h-7 w-7 rounded-md text-[10px] font-semibold transition ${
                  activeSection === link.key
                    ? 'bg-amber-500/25 text-amber-100 border border-amber-400/40'
                    : 'bg-slate-800/70 text-slate-300 hover:bg-slate-700'
                }`}
              >
                {link.label.charAt(0)}
              </button>
            ))}
          </div>
        )}
      </div>
    </aside>
  );
}