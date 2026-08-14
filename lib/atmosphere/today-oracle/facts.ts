/**
 * Layer 1 — Facts.
 * Collect structured transit rows. Do not generate copy here.
 */

import type { AtmospherePacket, LifeRiskDomain } from '@/lib/atmosphere/types';
import {
  aspectBand,
  formatTransitAspectKey,
  parseTransitAspectKey,
  titleCasePlanet,
} from '@/lib/transit-lookup';
import type { TransitFact, TransitFactSource } from '@/lib/atmosphere/today-oracle/types';

export interface TodayFactTransitRow {
  transit_aspect?: string;
  orb?: string;
  score?: number;
  adjustedScore?: number;
}

const PLANET_DOMAINS: Record<string, LifeRiskDomain[]> = {
  moon: ['family', 'self'],
  sun: ['self'],
  mercury: ['career', 'self'],
  venus: ['love', 'money'],
  mars: ['career', 'self'],
  jupiter: ['career', 'money'],
  saturn: ['career', 'self'],
  uranus: ['self'],
  neptune: ['self', 'love'],
  pluto: ['self', 'love'],
};

function domainsForPlanets(transiting: string, natal: string): LifeRiskDomain[] {
  const out: LifeRiskDomain[] = [];
  for (const name of [transiting, natal]) {
    for (const domain of PLANET_DOMAINS[name] || []) {
      if (!out.includes(domain)) out.push(domain);
    }
  }
  return out.length ? out : ['self'];
}

function parseOrb(raw?: string | number | null): number | null {
  if (typeof raw === 'number' && Number.isFinite(raw)) return Math.max(0, raw);
  if (!raw) return null;
  const match = String(raw).match(/[\d.]+/);
  if (!match) return null;
  const n = Number.parseFloat(match[0]);
  return Number.isFinite(n) ? n : null;
}

function tightnessScore(orbDeg: number | null, fallback = 42): number {
  if (orbDeg === null) return fallback;
  if (orbDeg <= 0.5) return 96;
  if (orbDeg <= 1) return 88;
  if (orbDeg <= 2) return 76;
  if (orbDeg <= 3.5) return 64;
  if (orbDeg <= 6) return 52;
  return 38;
}

function buildFact(
  transiting: string,
  aspect: string,
  natal: string,
  options: {
    orbDeg?: number | null;
    score?: number;
    domains?: LifeRiskDomain[];
    source: TransitFactSource;
  },
): TransitFact {
  const t = transiting.trim().toLowerCase();
  const n = natal.trim().toLowerCase();
  const a = aspect.trim().toLowerCase();
  const display = formatTransitAspectKey(t, a, n);
  return {
    key: display,
    transiting: t,
    aspect: a,
    natal: n,
    display: `${titleCasePlanet(t)} ${a} ${titleCasePlanet(n)}`,
    orbDeg: options.orbDeg ?? null,
    band: aspectBand(a),
    score: options.score ?? tightnessScore(options.orbDeg ?? null),
    domains: options.domains?.length ? options.domains : domainsForPlanets(t, n),
    source: options.source,
  };
}

function parseLabel(label: string): { transiting: string; aspect: string; natal: string } | null {
  return parseTransitAspectKey(label);
}

function upsert(map: Map<string, TransitFact>, fact: TransitFact) {
  const existing = map.get(fact.key);
  if (!existing) {
    map.set(fact.key, fact);
    return;
  }
  const existingOrb = existing.orbDeg ?? 99;
  const nextOrb = fact.orbDeg ?? 99;
  const preferIncomingDomains = fact.source === 'risk-driver' && fact.domains.length > 0;
  const domains = preferIncomingDomains
    ? Array.from(new Set([...fact.domains, ...existing.domains]))
    : Array.from(new Set([...existing.domains, ...fact.domains]));
  if (nextOrb < existingOrb || fact.score > existing.score || preferIncomingDomains) {
    map.set(fact.key, {
      ...existing,
      ...fact,
      domains,
      orbDeg: nextOrb < existingOrb ? fact.orbDeg : existing.orbDeg,
      score: Math.max(existing.score, fact.score),
    });
  } else {
    existing.domains = domains;
  }
}

export interface GatherTodayFactsInput {
  transitLookup?: TodayFactTransitRow[] | null;
  packet?: AtmospherePacket | null;
}

export function gatherTodayFacts(input: GatherTodayFactsInput): TransitFact[] {
  const map = new Map<string, TransitFact>();

  for (const row of input.transitLookup || []) {
    const parsed = parseLabel(row.transit_aspect || '');
    if (!parsed) continue;
    upsert(
      map,
      buildFact(parsed.transiting, parsed.aspect, parsed.natal, {
        orbDeg: parseOrb(row.orb),
        score: row.adjustedScore ?? row.score ?? tightnessScore(parseOrb(row.orb)),
        source: 'transit-lookup',
      }),
    );
  }

  for (const driver of input.packet?.risk?.topDrivers || []) {
    const parsed = parseLabel(driver.label || '');
    if (!parsed) continue;
    upsert(
      map,
      buildFact(parsed.transiting, parsed.aspect, parsed.natal, {
        score: typeof driver.friction === 'number' ? driver.friction : undefined,
        domains: driver.domains,
        source: 'risk-driver',
      }),
    );
  }

  const dominant = input.packet?.dominantDriver?.label;
  if (dominant) {
    const parsed = parseLabel(dominant);
    if (parsed) {
      upsert(
        map,
        buildFact(parsed.transiting, parsed.aspect, parsed.natal, {
          score: input.packet?.intensity,
          source: 'dominant',
        }),
      );
    }
  }

  return Array.from(map.values()).sort((a, b) => {
    const orbA = a.orbDeg ?? 99;
    const orbB = b.orbDeg ?? 99;
    if (orbA !== orbB) return orbA - orbB;
    return b.score - a.score;
  });
}
