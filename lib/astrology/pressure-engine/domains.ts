import type { DomainScore, DomainTone, LifeDomain, TransitDriver } from '@/types/astrology';
import { inferValence, rewriteLayReason } from './lay-reason';

export const DEFAULT_DOMAINS: LifeDomain[] = [
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

const PREDICTIVE_TO_LIFE: Record<string, LifeDomain> = {
  self: 'identity',
  career: 'career',
  love: 'relationships',
  money: 'finances',
  family: 'social_connection',
  health: 'mental_strain',
};

const PLANET_LIFE_DOMAINS: Record<string, LifeDomain[]> = {
  sun: ['identity', 'career'],
  moon: ['mental_strain', 'social_connection'],
  mercury: ['career', 'mental_strain'],
  venus: ['relationships', 'finances', 'creativity'],
  mars: ['career', 'identity'],
  jupiter: ['career', 'finances', 'spiritual_growth'],
  saturn: ['career', 'finances', 'identity'],
  uranus: ['reinvention', 'career'],
  neptune: ['spiritual_growth', 'creativity'],
  pluto: ['reinvention', 'identity'],
  chiron: ['mental_strain', 'identity'],
  ascendant: ['identity'],
  rising: ['identity'],
  midheaven: ['career'],
};

function clamp(value: number): number {
  return Math.max(0, Math.min(100, Math.round(value)));
}

function planetKey(value?: string | null): string {
  return (value || '').trim().toLowerCase();
}

export function lifeDomainsForDriver(driver: TransitDriver): LifeDomain[] {
  if (driver.domains?.length) {
    return Array.from(new Set(driver.domains));
  }
  const found = new Set<LifeDomain>();
  const natal = planetKey(driver.natalPlanet);
  const transiting = planetKey(driver.transitingPlanet);
  for (const key of [natal, transiting]) {
    for (const domain of PLANET_LIFE_DOMAINS[key] || []) found.add(domain);
  }
  const label = `${driver.label || ''} ${driver.reason || ''}`.toLowerCase();
  for (const [planet, domains] of Object.entries(PLANET_LIFE_DOMAINS)) {
    if (label.includes(planet)) {
      for (const domain of domains) found.add(domain);
    }
  }
  return Array.from(found);
}

export function mapPredictiveDomainName(name: string): LifeDomain | null {
  return PREDICTIVE_TO_LIFE[name] || (DEFAULT_DOMAINS.includes(name as LifeDomain) ? (name as LifeDomain) : null);
}

function blend(hits: number[]): number {
  if (!hits.length) return 0;
  const max = Math.max(...hits);
  const mean = hits.reduce((sum, value) => sum + value, 0) / hits.length;
  const blended = 0.45 * max + 0.55 * mean;
  const multi = 1 + 0.05 * Math.min(hits.length - 1, 3);
  return clamp(blended * multi);
}

export function domainToneFromScores(pressure: number, opportunity: number): DomainTone {
  if (opportunity >= 22 && opportunity >= pressure + 6) return 'opportunity';
  if (pressure >= 42 && pressure > opportunity + 4) return 'pressure';
  return 'neutral';
}

function enrichDriver(driver: TransitDriver): TransitDriver {
  const domains = lifeDomainsForDriver(driver);
  const valence =
    typeof driver.valence === 'number' && Number.isFinite(driver.valence)
      ? driver.valence
      : inferValence(driver.aspect || driver.label);
  return {
    ...driver,
    domains,
    valence,
    layReason: driver.layReason || rewriteLayReason(driver.reason || driver.label),
  };
}

/**
 * Score each life domain from the transits that actually touch it.
 * Never copy the global pressure number onto every row.
 */
export function buildDomainScores(
  _globalPressure: number,
  confidence: number,
  topDrivers: TransitDriver[],
  domains: LifeDomain[] = DEFAULT_DOMAINS,
): DomainScore[] {
  const enriched = (topDrivers || []).map(enrichDriver);

  return domains.map((domain) => {
    const hits = enriched.filter((driver) => (driver.domains || []).includes(domain));
    const pressureHits: number[] = [];
    const opportunityHits: number[] = [];

    for (const driver of hits) {
      const strength = Number.isFinite(driver.strength) ? driver.strength : 0;
      const valence = driver.valence ?? 0;
      if (valence >= 0.2) {
        opportunityHits.push(strength * (0.7 + 0.3 * Math.min(1, valence)));
      } else if (valence <= -0.15) {
        pressureHits.push(strength * (0.75 + 0.35 * Math.min(1, Math.abs(valence))));
      } else {
        pressureHits.push(strength * 0.35);
        opportunityHits.push(strength * 0.35);
      }
    }

    const domainPressure = hits.length ? blend(pressureHits) : 0;
    const opportunity = hits.length ? blend(opportunityHits) : 0;
    const tone = domainToneFromScores(domainPressure, opportunity);
    const volatility = hits.length
      ? clamp(Math.abs(domainPressure - opportunity) * 0.8 + hits.length * 4)
      : 0;

    return {
      domain,
      pressure: domainPressure,
      opportunity,
      volatility,
      confidence: hits.length
        ? clamp(
            hits.reduce((sum, driver) => sum + (driver.confidence || confidence), 0) / hits.length,
          )
        : confidence,
      tone,
      topDrivers: hits.sort((a, b) => (b.strength || 0) - (a.strength || 0)).slice(0, 6),
    };
  });
}
