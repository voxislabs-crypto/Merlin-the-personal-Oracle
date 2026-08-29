/**
 * Chart is the source of truth for voice — not a zodiac lookup key.
 * Two Leos with different Moons must not sound identical.
 */

import { traditionalRuler } from '@/lib/astrology/natal-sensitivity';
import {
  getSignMeta,
  SIGN_TRAITS,
  type ZodiacElement,
  type ZodiacSignName,
} from '@/lib/astrology/zodiac';
import type { Aspect, BirthChartData, PlanetPosition } from '@/types/astrology';

export interface ChartVoiceInput {
  sunSign?: string | null;
  moonSign?: string | null;
  risingSign?: string | null;
  planets?: Array<Pick<PlanetPosition, 'name' | 'sign'> & { house?: number }>;
  positions?: Array<Pick<PlanetPosition, 'name' | 'sign'> & { house?: number }>;
  ascendant?: { sign?: string };
  aspects?: Array<
    Pick<Aspect, 'type'> & {
      planet1?: { name?: string } | string;
      planet2?: { name?: string } | string;
    }
  >;
}

export interface ChartVoiceFacts {
  sunSign?: string;
  moonSign?: string;
  risingSign?: string;
  sunElement?: ZodiacElement;
  moonElement?: ZodiacElement;
  risingElement?: ZodiacElement;
  dominantElement?: ZodiacElement | 'balanced';
  dominantModality?: string;
  chartRuler?: string | null;
  chartRulerSign?: string;
  keyAspects: string[];
  fingerprint: string;
}

const ELEMENT_VOICE: Record<ZodiacElement, string> = {
  Fire: 'Lead with heat and motion. Prefer short declaratives. Name the want.',
  Earth: 'Stay concrete — body, work, money, time. No floating abstractions.',
  Air: 'Think in distinctions. A question is allowed if it moves the call.',
  Water: 'Name the felt weather first. Implication over announcement.',
};

function cleanSign(value?: string | null): ZodiacSignName | undefined {
  if (!value) return undefined;
  const trimmed = value.trim();
  const match = getSignMeta(trimmed);
  return match?.name;
}

function planetName(value: { name?: string } | string | undefined): string {
  if (!value) return '';
  if (typeof value === 'string') return value;
  return value.name || '';
}

function findPlanet(
  planets: ChartVoiceInput['planets'],
  name: string,
): { name?: string; sign?: string } | undefined {
  const want = name.toLowerCase();
  return planets?.find((p) => (p.name || '').toLowerCase() === want);
}

export function extractChartVoiceFacts(
  chart?: ChartVoiceInput | BirthChartData | null,
): ChartVoiceFacts {
  const input = (chart || {}) as ChartVoiceInput & Partial<BirthChartData>;
  const planets = input.planets || input.positions || [];
  const sun = cleanSign(input.sunSign) || cleanSign(findPlanet(planets, 'Sun')?.sign);
  const moon = cleanSign(input.moonSign) || cleanSign(findPlanet(planets, 'Moon')?.sign);
  const rising =
    cleanSign(input.risingSign) ||
    cleanSign(input.ascendant?.sign) ||
    cleanSign(findPlanet(planets, 'Ascendant')?.sign);

  const counts: Record<ZodiacElement, number> = { Fire: 0, Earth: 0, Air: 0, Water: 0 };
  const modCounts: Record<string, number> = { Cardinal: 0, Fixed: 0, Mutable: 0 };
  for (const p of planets) {
    const meta = p.sign ? getSignMeta(p.sign) : undefined;
    if (meta) {
      counts[meta.element] += 1;
      modCounts[meta.modality] += 1;
    }
  }
  const dominantElement =
    (Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] as ZodiacElement | undefined) ||
    'balanced';
  const dominantModality = Object.entries(modCounts).sort((a, b) => b[1] - a[1])[0]?.[0];

  const ruler = traditionalRuler(rising);
  const rulerSign = ruler
    ? cleanSign(findPlanet(planets, ruler)?.sign)
    : undefined;

  const keyAspects = (input.aspects || [])
    .filter((a) => {
      const t = (a.type || '').toLowerCase();
      return ['conjunction', 'square', 'opposition', 'trine', 'sextile'].includes(t);
    })
    .slice(0, 4)
    .map((a) => {
      const p1 = planetName(a.planet1) || '?';
      const p2 = planetName(a.planet2) || '?';
      return `${p1} ${a.type} ${p2}`;
    })
    .filter((line) => line !== '?  ?');

  const fingerprint = [
    sun || '',
    moon || '',
    rising || '',
    dominantElement,
    ruler || '',
    rulerSign || '',
    keyAspects.join(','),
  ].join('|');

  return {
    sunSign: sun,
    moonSign: moon,
    risingSign: rising,
    sunElement: sun ? getSignMeta(sun)?.element : undefined,
    moonElement: moon ? getSignMeta(moon)?.element : undefined,
    risingElement: rising ? getSignMeta(rising)?.element : undefined,
    dominantElement,
    dominantModality,
    chartRuler: ruler,
    chartRulerSign: rulerSign,
    keyAspects,
    fingerprint,
  };
}

function signNote(role: string, sign?: string): string | null {
  if (!sign) return null;
  const traits = SIGN_TRAITS[sign as ZodiacSignName];
  const meta = getSignMeta(sign);
  if (!traits || !meta) return `${role} in ${sign}.`;
  return `${role} in ${sign} (${meta.element}, ${meta.modality}): ${traits.summary} Keywords: ${traits.keywords.join(', ')}.`;
}

/**
 * Dynamic voice notes from the actual chart.
 * Not a dictionary keyed only by Sun sign.
 */
export function chartVoiceNotes(facts: ChartVoiceFacts): string[] {
  const notes: string[] = [];
  const sun = signNote('Sun', facts.sunSign);
  const moon = signNote('Moon', facts.moonSign);
  const rising = signNote('Rising', facts.risingSign);
  if (sun) notes.push(sun);
  if (moon) notes.push(moon);
  if (rising) notes.push(rising);

  if (facts.sunSign && facts.moonSign && facts.sunSign !== facts.moonSign) {
    notes.push(
      `Do not sound like a generic ${facts.sunSign}. The Moon in ${facts.moonSign} changes the emotional register — two ${facts.sunSign} Suns with different Moons must not read the same.`,
    );
  }

  if (facts.dominantElement && facts.dominantElement !== 'balanced') {
    notes.push(
      `Dominant element ${facts.dominantElement}: ${ELEMENT_VOICE[facts.dominantElement]}`,
    );
  }

  if (facts.chartRuler) {
    notes.push(
      `Chart ruler is ${facts.chartRuler}${
        facts.chartRulerSign ? ` in ${facts.chartRulerSign}` : ''
      }. Let that planet's style tint the cadence (Mercury = distinctions, Venus = relational, Mars = heat, Moon = felt, Sun = identity, Saturn = gravity, Jupiter = horizon).`,
    );
  }

  if (facts.keyAspects.length) {
    notes.push(`Key natal aspects to respect in tone (not to lecture about): ${facts.keyAspects.join('; ')}.`);
  }

  return notes;
}
