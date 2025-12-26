'use client';

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PLANET_TOOLTIPS } from '@/lib/astrology/BirthChartTooltips';
import { PLANET_GLYPHS } from '@/lib/astrology/planetaryData';

interface ChartTabsProps {
  planets: any[];
  aspects: any[];
  transits: any[];
  aspectPatterns: any[];
  dignities: any[];
  fixedStars: any[];
  karmic: any[];
  onHoverPlanet: (name: string | null) => void;
  onHoverAspect: (id: string | null) => void;
}

export function ChartTabs({ 
  planets, 
  aspects, 
  transits = [], 
  aspectPatterns = [], 
  dignities = [], 
  fixedStars = [], 
  karmic = [],
  onHoverPlanet,
  onHoverAspect
}: ChartTabsProps) {
  const [activeTab, setActiveTab] = useState('chart');

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full mt-12">
      <TabsList className="grid w-full grid-cols-5 bg-slate-900/50 backdrop-blur border border-amber-500/20">
        <TabsTrigger value="chart" className="text-amber-400">Chart</TabsTrigger>
        <TabsTrigger value="planets" className="text-amber-400">Planets</TabsTrigger>
        <TabsTrigger value="aspects" className="text-amber-400">Aspects</TabsTrigger>
        <TabsTrigger value="transits" className="text-amber-400">Transits</TabsTrigger>
        <TabsTrigger value="advanced" className="text-amber-400">Advanced</TabsTrigger>
      </TabsList>

      <TabsContent value="chart" className="mt-8">
        <div className="text-center text-amber-300 italic">Interactive wheel above</div>
      </TabsContent>

      <TabsContent value="planets">
        <ScrollArea className="h-96 rounded-lg border border-amber-500/30 bg-slate-900/50 backdrop-blur p-6">
          <div className="space-y-4">
            {planets.map((p: any) => (
              <div
                key={p.name}
                className="p-4 rounded-lg bg-slate-800/50 border border-amber-500/20 hover:border-amber-400 hover:bg-slate-700/50 transition-all cursor-pointer"
                onMouseEnter={() => onHoverPlanet(p.name)}
                onMouseLeave={() => onHoverPlanet(null)}
              >
                <div className="flex items-center gap-4">
                  <span className="text-3xl">{PLANET_GLYPHS[p.name as keyof typeof PLANET_GLYPHS] || '●'}</span>
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
        </ScrollArea>
      </TabsContent>

      <TabsContent value="aspects">
        <ScrollArea className="h-96 rounded-lg border border-amber-500/30 bg-slate-900/50 backdrop-blur p-6">
          <div className="space-y-4">
            {aspects.map((a: any, i: number) => {
              const id = `${a.planet1.name}-${a.planet2.name}`;
              return (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-slate-800/50 border border-amber-500/20 hover:border-amber-400 hover:bg-slate-700/50 transition-all cursor-pointer"
                  onMouseEnter={() => onHoverAspect(id)}
                  onMouseLeave={() => onHoverAspect(null)}
                >
                  <div className="font-bold text-amber-400">
                    {a.planet1.name} {a.type} {a.planet2.name} (orb {a.orb?.toFixed?.(2) || '0.00'}°)
                    {a.exact && " — EXACT"}
                  </div>
                  <div className="text-sm text-gray-300 mt-1">
                    {a.meaning || 'No interpretation available'}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="transits">
        <ScrollArea className="h-96 rounded-lg border border-amber-500/30 bg-slate-900/50 backdrop-blur p-6">
          <div className="text-amber-300 text-center mb-4">
            Current Transits — {new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
          </div>
          <div className="space-y-4">
            {transits.length > 0 ? (
              transits.map((t: any, i: number) => (
                <div
                  key={i}
                  className="p-4 rounded-lg bg-slate-800/50 border border-amber-500/20 hover:border-amber-400 transition-all cursor-pointer"
                  onMouseEnter={() => onHoverPlanet(t.transitingPlanet)}
                  onMouseLeave={() => onHoverPlanet(null)}
                >
                  <div className="font-bold text-amber-400">
                    {t.transitingPlanet} {t.aspect} natal {t.natalPlanet} (orb {t.orb?.toFixed?.(2) || '0.00'}°)
                    {t.exact && " — EXACT"}
                  </div>
                </div>
              ))
            ) : (
              <div className="text-center text-amber-300/70 italic">No current transits available</div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>

      <TabsContent value="advanced">
        <ScrollArea className="h-96 rounded-lg border border-amber-500/30 bg-slate-900/50 backdrop-blur p-6">
          <div className="space-y-6">
            {aspectPatterns.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-3">Aspect Patterns</h3>
                {aspectPatterns.map((p: any, i: number) => (
                  <div key={i} className="p-3 bg-purple-900/50 rounded mb-2">
                    <strong>{p.type}</strong> — {p.planets?.join?.(' / ') || 'N/A'}
                  </div>
                ))}
              </div>
            ) : null}

            {fixedStars.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-3">Fixed Stars</h3>
                {fixedStars.map((s: any, i: number) => (
                  <div key={i} className="p-3 bg-indigo-900/50 rounded mb-2">
                    {s.star} conjunct {s.planet} — {s.influence || 'No influence data'}
                  </div>
                ))}
              </div>
            ) : null}

            {karmic.length > 0 ? (
              <div>
                <h3 className="text-xl font-bold text-amber-400 mb-3">Karmic Path</h3>
                {karmic.map((k: any, i: number) => (
                  <div key={i} className="p-4 bg-pink-900/50 rounded">
                    {k.interpretation || 'No karmic interpretation available'}
                  </div>
                ))}
              </div>
            ) : null}

            {!aspectPatterns.length && !fixedStars.length && !karmic.length && (
              <div className="text-center text-amber-300/70 italic">No advanced data available</div>
            )}
          </div>
        </ScrollArea>
      </TabsContent>
    </Tabs>
  );
}
