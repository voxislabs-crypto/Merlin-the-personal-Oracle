'use client';

import { useEffect, useMemo, useState } from 'react';
import { ChevronDown, ChevronRight } from 'lucide-react';
import deepDiveTemplates from '@/data/deep-dive-templates.json';
import { BirthChartData } from '@/components/astrology/BirthChartCalculator';
import { calculateDeepDive, DeepDiveResult } from '@/lib/astrology/deep-dive';

interface DeepDivePanelProps {
  birthData: BirthChartData | null;
}

const CACHE_KEY = 'merlin_deep_dive_cache_v1';
const CACHE_TTL_MS = 24 * 60 * 60 * 1000;

interface DeepDiveCacheValue {
  fingerprint: string;
  expiresAt: number;
  result: DeepDiveResult;
}

const minuteFormat = (degree: number, minute: number): string =>
  `${degree}\u00B0${minute.toString().padStart(2, '0')}'`;

const buildFingerprint = (chart: BirthChartData): string => {
  const birth = chart.birthData || {};
  const lat = birth.coordinates?.lat ?? 0;
  const lon = birth.coordinates?.lon ?? 0;
  const planets = (chart.planets || [])
    .map((planet) => `${planet.name}:${Number(planet.longitude ?? 0).toFixed(4)}`)
    .join('|');
  const houses = (chart.houses || [])
    .map((house) => Number(house.longitude ?? house.position ?? 0).toFixed(4))
    .join('|');

  return [
    birth.birthDate || '',
    birth.birthTime || '',
    lat.toFixed(4),
    lon.toFixed(4),
    planets,
    houses,
    Number(chart.jd || 0).toFixed(6),
    ((chart as any).metadata as any)?.calculationSource || '',
  ].join('::');
};

const readCache = (): DeepDiveCacheValue | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;

    const parsed = JSON.parse(raw) as DeepDiveCacheValue;
    if (!parsed || !parsed.expiresAt || Date.now() > parsed.expiresAt) {
      localStorage.removeItem(CACHE_KEY);
      return null;
    }

    return parsed;
  } catch {
    return null;
  }
};

const writeCache = (value: DeepDiveCacheValue) => {
  try {
    localStorage.setItem(CACHE_KEY, JSON.stringify(value));
  } catch {
    // Ignore storage quota and browser privacy errors.
  }
};

export function DeepDivePanel({ birthData }: DeepDivePanelProps) {
  const [open, setOpen] = useState(false);
  const [deepDive, setDeepDive] = useState<DeepDiveResult | null>(null);

  const fingerprint = useMemo(() => {
    if (!birthData) return null;
    return buildFingerprint(birthData);
  }, [birthData]);

  useEffect(() => {
    if (!birthData || !fingerprint) {
      setDeepDive(null);
      return;
    }

    const cached = readCache();
    if (cached && cached.fingerprint === fingerprint) {
      setDeepDive(cached.result);
      return;
    }

    const result = calculateDeepDive(birthData, deepDiveTemplates);
    setDeepDive(result);
    writeCache({
      fingerprint,
      expiresAt: Date.now() + CACHE_TTL_MS,
      result,
    });
  }, [birthData, fingerprint]);

  if (!birthData) return null;

  return (
    <div className="bg-slate-900/40 rounded-lg border border-amber-500/20 backdrop-blur-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-slate-800/40 transition-colors"
      >
        <span className="text-xl font-semibold text-amber-300">Show Deep Dive</span>
        {open ? (
          <ChevronDown className="h-5 w-5 text-amber-300" />
        ) : (
          <ChevronRight className="h-5 w-5 text-amber-300" />
        )}
      </button>

      {open && deepDive && (
        <div className="px-6 pb-6 space-y-8">
          <section>
            <h3 className="text-lg font-semibold text-amber-200 mb-3">Cusps</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 text-sm text-slate-200">
              {deepDive.cusps.map((cusp) => (
                <div key={cusp.house} className="rounded-md bg-slate-800/40 px-3 py-2 border border-slate-700/50">
                  {`${cusp.house}${cusp.house === 1 ? 'st' : cusp.house === 2 ? 'nd' : cusp.house === 3 ? 'rd' : 'th'}: ${cusp.sign} ${minuteFormat(cusp.degree, cusp.minute)}`}
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-amber-200 mb-3">Planets in Houses</h3>
            <div className="space-y-3">
              {deepDive.planetsInHouses.map((entry) => (
                <div key={`${entry.planet}-${entry.house}`} className="rounded-lg bg-slate-800/35 border border-slate-700/50 p-4">
                  <div className="text-slate-100 font-medium mb-1">
                    {`${entry.planet}: ${entry.sign} ${minuteFormat(entry.degree, entry.minute)} in ${entry.house}${entry.house === 1 ? 'st' : entry.house === 2 ? 'nd' : entry.house === 3 ? 'rd' : 'th'} house`}
                  </div>
                  <p className="text-slate-300 text-sm leading-relaxed">{entry.description}</p>
                </div>
              ))}
            </div>
          </section>

          <section>
            <h3 className="text-lg font-semibold text-amber-200 mb-3">Interceptions & Rulers</h3>

            <div className="space-y-3 mb-5">
              {deepDive.interceptions.length > 0 ? (
                deepDive.interceptions.map((item) => (
                  <div key={`${item.sign}-${item.house}`} className="rounded-lg bg-slate-800/35 border border-slate-700/50 p-4">
                    <div className="text-slate-100 font-medium mb-1">
                      {`${item.sign} intercepted in ${item.house}${item.house === 1 ? 'st' : item.house === 2 ? 'nd' : item.house === 3 ? 'rd' : 'th'} house`}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{item.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-emerald-900/20 border border-emerald-700/30 p-4 text-sm text-emerald-200">
                  No intercepted signs detected in this Placidus chart.
                </div>
              )}
            </div>

            <div className="space-y-3">
              {deepDive.rulerAspects.length > 0 ? (
                deepDive.rulerAspects.map((row) => (
                  <div
                    key={`${row.house}-${row.ruler}-${row.aspectType}-${row.withPlanet}`}
                    className="rounded-lg bg-slate-800/35 border border-slate-700/50 p-4"
                  >
                    <div className="text-slate-100 font-medium mb-1">
                      {`${row.ruler} rules ${row.house}${row.house === 1 ? 'st' : row.house === 2 ? 'nd' : row.house === 3 ? 'rd' : 'th'} (${row.houseSign}) - ${row.aspectType} ${row.withPlanet} (${row.orb.toFixed(2)}\u00B0 orb)`}
                    </div>
                    <p className="text-slate-300 text-sm leading-relaxed">{row.description}</p>
                  </div>
                ))
              ) : (
                <div className="rounded-lg bg-slate-800/35 border border-slate-700/50 p-4 text-sm text-slate-300">
                  No major ruler aspects were detected in the current aspect set.
                </div>
              )}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
