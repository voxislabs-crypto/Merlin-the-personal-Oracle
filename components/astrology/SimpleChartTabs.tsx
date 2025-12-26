'use client';

import React, { useState } from 'react';
import { PLANET_TOOLTIPS } from '@/lib/astrology/BirthChartTooltips';
import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';

interface SimpleChartTabsProps {
  planets: any[];
  aspects: any[];
}

export function SimpleChartTabs({ planets, aspects }: SimpleChartTabsProps) {
  const [activeTab, setActiveTab] = useState('chart');

  const tabs = [
    { id: 'chart', label: 'Chart' },
    { id: 'planets', label: 'Planets' },
    { id: 'aspects', label: 'Aspects' },
    { id: 'transits', label: 'Transits' },
    { id: 'advanced', label: 'Advanced' },
  ];

  return (
    <div className="mt-12 p-8 bg-slate-900/50 rounded-xl border border-amber-500/30">
      {/* Tab Headers */}
      <div className="flex space-x-2 mb-8 border-b border-amber-500/30">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-6 py-3 font-semibold transition-all ${
              activeTab === tab.id
                ? 'text-amber-400 border-b-2 border-amber-400'
                : 'text-amber-300/70 hover:text-amber-300'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="min-h-[400px]">
        {activeTab === 'chart' && (
          <div className="text-center text-amber-300 italic">
            Interactive wheel is displayed above
          </div>
        )}

        {activeTab === 'planets' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {planets.map((p: any) => (
              <div
                key={p.name}
                className="p-4 rounded-lg bg-slate-800/50 border border-amber-500/20 hover:border-amber-400 hover:bg-slate-700/50 transition-all"
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl text-amber-400">
                    {PLANET_GLYPHS[p.name as keyof typeof PLANET_GLYPHS] || '●'}
                  </span>
                  <div>
                    <div className="font-bold text-amber-400">
                      {p.name} in {p.sign} {p.degree}°{p.minute}' — House {p.house}
                    </div>
                    <div className="text-sm text-gray-300 mt-1">
                      {PLANET_TOOLTIPS[p.name as keyof typeof PLANET_TOOLTIPS]}
                    </div>
                    {p.dignities && p.dignities.length > 0 && (
                      <div className="text-xs text-amber-300 mt-2">
                        Dignities: {p.dignities.join(', ')}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'aspects' && (
          <div className="space-y-4 max-h-96 overflow-y-auto">
            {aspects.map((a: any, i: number) => (
              <div
                key={i}
                className="p-4 rounded-lg bg-slate-800/50 border border-amber-500/20 hover:border-amber-400 hover:bg-slate-700/50 transition-all"
              >
                <div className="font-bold text-amber-400">
                  {a.planet1.name} {a.type} {a.planet2.name} (orb {a.orb?.toFixed?.(2) || '0.00'}°)
                  {a.exact && " — EXACT"}
                </div>
                <div className="text-sm text-gray-300 mt-1">
                  {a.meaning || 'No interpretation available'}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'transits' && (
          <div className="text-center text-amber-300/70 italic">
            Transits feature coming soon...
          </div>
        )}

        {activeTab === 'advanced' && (
          <div className="text-center text-amber-300/70 italic">
            Advanced features coming soon...
          </div>
        )}
      </div>
    </div>
  );
}
