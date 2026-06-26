'use client';

import { useState } from 'react';
import { ChevronLeft, ChevronRight, LayoutGrid, Settings2 } from 'lucide-react';
import {
  MODULE_LABELS,
  type DashboardModuleKey,
  type DashboardModulePreferences,
} from '@/lib/dashboard/module-preferences';

export type NavSectionKey = 'chart' | 'forecast' | 'analysis' | 'weekly' | 'personality' | 'prophecy';

type FocusSection = 'interpretation' | 'transits' | 'lifearc' | 'personality' | 'stormradar';

interface DashboardNavigatorProps {
  collapsed: boolean;
  onCollapsedChange: (collapsed: boolean) => void;
  activeNavSection: NavSectionKey;
  onScrollToSection: (section: NavSectionKey) => void;
  onOpenFocusSection: (section: FocusSection) => void;
  compactMode: boolean;
  onCompactModeChange: (compact: boolean) => void;
  premiumLocked: boolean;
  mbtiType?: string;
  modulePreferences: DashboardModulePreferences;
  onModulePreferencesChange: (prefs: DashboardModulePreferences) => void;
}

const SECTION_LINKS: Array<{ key: NavSectionKey; label: string; title: string }> = [
  { key: 'chart', label: 'Chart + Oracle', title: 'Go to birth chart wheel' },
  { key: 'forecast', label: 'Daily Forecast', title: 'Go to daily transit forecast' },
  { key: 'analysis', label: 'Analysis Panels', title: 'Go to focus analysis panels' },
  { key: 'weekly', label: 'Weekly Forecast', title: 'Go to weekly forecast' },
  { key: 'personality', label: 'Dual MBTI', title: 'Go to dual MBTI cards' },
  { key: 'prophecy', label: 'Prophecy', title: 'Go to personal prophecy' },
];

const FOCUS_LINKS: Array<{ key: FocusSection; label: string; title: string }> = [
  { key: 'interpretation', label: 'Chart Reading', title: 'Open chart interpretation' },
  { key: 'transits', label: 'Active Transits', title: 'Open active transits' },
  { key: 'lifearc', label: 'Life Timeline', title: 'Open life timeline' },
  { key: 'personality', label: 'Dual MBTI', title: 'Open dual MBTI view' },
  { key: 'stormradar', label: 'Storm Radar', title: 'Open storm radar' },
];

function navButtonClass(isActive: boolean) {
  if (isActive) {
    return 'w-full text-left px-2.5 py-1.5 text-xs rounded-md border border-amber-400/50 bg-amber-500/20 text-amber-100 transition';
  }
  return 'w-full text-left px-2.5 py-1.5 text-xs rounded-md bg-slate-800/70 text-slate-200 hover:bg-slate-700 transition';
}

export function DashboardNavigator({
  collapsed,
  onCollapsedChange,
  activeNavSection,
  onScrollToSection,
  onOpenFocusSection,
  compactMode,
  onCompactModeChange,
  premiumLocked,
  mbtiType,
  modulePreferences,
  onModulePreferencesChange,
}: DashboardNavigatorProps) {
  const [showModuleSettings, setShowModuleSettings] = useState(false);

  const toggleModule = (key: DashboardModuleKey) => {
    onModulePreferencesChange({
      ...modulePreferences,
      [key]: !modulePreferences[key],
    });
  };

  return (
    <aside
      className={`hidden lg:block shrink-0 sticky top-20 self-start z-30 transition-all duration-200 ${
        collapsed ? 'w-14' : 'w-52'
      }`}
    >
      <div className="rounded-xl border border-slate-700/70 bg-slate-950/90 backdrop-blur shadow-lg p-2.5">
        <div className="flex items-center justify-between px-1 mb-2">
          {!collapsed ? (
            <p className="text-[10px] uppercase tracking-wider text-slate-400">Navigator</p>
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
              <p className="px-1 text-[10px] uppercase tracking-wider text-slate-500">Sections</p>
              {SECTION_LINKS.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  onClick={() => onScrollToSection(link.key)}
                  className={navButtonClass(activeNavSection === link.key)}
                  title={link.title}
                >
                  {link.label}
                </button>
              ))}
            </div>

            <div className="space-y-1 border-t border-white/8 pt-2">
              <p className="px-1 text-[10px] uppercase tracking-wider text-slate-500">Focus Views</p>
              {FOCUS_LINKS.map((link) => (
                <button
                  key={link.key}
                  type="button"
                  onClick={() => onOpenFocusSection(link.key)}
                  disabled={premiumLocked}
                  className={`${navButtonClass(false)} disabled:opacity-50`}
                  title={premiumLocked ? 'Requires paid plan' : link.title}
                >
                  {link.label}
                  {link.key === 'personality' && mbtiType ? ` (${mbtiType})` : ''}
                  {premiumLocked ? ' • Locked' : ''}
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
              <p className="px-1 text-[10px] text-slate-500 leading-relaxed">
                Compact mode hides secondary panels so you can focus on one section.
              </p>

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
            {SECTION_LINKS.map((link) => (
              <button
                key={link.key}
                type="button"
                onClick={() => onScrollToSection(link.key)}
                title={link.label}
                className={`h-7 w-7 rounded-md text-[10px] font-semibold transition ${
                  activeNavSection === link.key
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