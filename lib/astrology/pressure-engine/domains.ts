import 'server-only';

import type { DomainScore, LifeDomain, TransitDriver } from '@/types/astrology';

const DEFAULT_DOMAINS: LifeDomain[] = [
  'identity',
  'career',
  'relationships',
  'finances',
  'mental_strain',
  'creativity',
  'spiritual_growth',
  'social_connection',
  'reinvention',
];

export function buildDomainScores(
  pressure: number,
  confidence: number,
  topDrivers: TransitDriver[],
  domains: LifeDomain[] = DEFAULT_DOMAINS
): DomainScore[] {
  return domains.map((domain) => ({
    domain,
    pressure,
    volatility: Math.max(0, Math.min(100, Math.round(pressure * 0.8))),
    confidence,
    topDrivers,
  }));
}
