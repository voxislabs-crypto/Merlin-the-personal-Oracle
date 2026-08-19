import { selectMentionWorthy, type TransitHitInput } from '@/lib/astrology/mention-worthy';
import {
  extractLivedThemes,
  extractLivedThemesFromMention,
  type ThemeSignal,
} from '@/lib/astrology/lived-themes';
import type { PlanetPosition } from '@/types/astrology';

const TODAY = '2026-08-19';

function hit(
  transitingPlanet: string,
  aspect: string,
  natalPlanet: string,
  orb: number,
): TransitHitInput {
  return { transitingPlanet, natalPlanet, aspect, orb, date: TODAY };
}

function planet(name: string, longitude: number, house?: number): PlanetPosition {
  return {
    name,
    longitude,
    latitude: 0,
    distance: 0,
    sign: 'Leo',
    degree: 0,
    minute: 0,
    house,
  };
}

const natal = {
  planets: [planet('Sun', 140, 10), planet('Moon', 20, 4), planet('Saturn', 50, 7)],
  aspects: [{ type: 'Square', planet1: { name: 'Sun' }, planet2: { name: 'Saturn' } }],
  ascendantSign: 'Leo',
};

describe('lived themes', () => {
  it('collapses several Sun/Saturn/Pluto signals into one identity-restructuring theme', () => {
    const mention = selectMentionWorthy(
      [hit('Saturn', 'Square', 'Sun', 0.9), hit('Pluto', 'Opposition', 'Sun', 1.1)],
      TODAY,
    );
    const extra: ThemeSignal[] = [
      {
        source: 'progression',
        label: 'Progressed Sun Square natal Saturn',
        actor: 'Sun',
        natalPlanet: 'Saturn',
        aspect: 'Square',
        orb: 0.4,
        impact: 80,
      },
      {
        source: 'solar-return',
        label: 'SR Saturn Conjunction natal Midheaven',
        actor: 'Saturn',
        natalPlanet: 'Midheaven',
        aspect: 'Conjunction',
        orb: 0.6,
        impact: 82,
      },
    ];
    const packet = extractLivedThemesFromMention(mention, natal, extra);
    expect(packet.framing).toBe('symbolic-emphasis');
    expect(packet.themes[0].theme).toMatch(/identity|responsibility|constraint/i);
    expect(packet.themes[0].contributors.length).toBeGreaterThanOrEqual(3);
    expect(packet.themes[0].signalStrength).toBeGreaterThan(70);
    expect(packet.domains.identity).toBeGreaterThan(packet.domains.relationships);
  });

  it('scores Saturn pressure/growth differently from Uranus instability', () => {
    const saturn = extractLivedThemes(
      [
        {
          source: 'transit',
          label: 'Saturn Square natal Sun',
          actor: 'Saturn',
          natalPlanet: 'Sun',
          aspect: 'Square',
          orb: 0.8,
          impact: 90,
        },
      ],
      natal,
    ).themes[0];
    const uranus = extractLivedThemes(
      [
        {
          source: 'transit',
          label: 'Uranus Conjunction natal Ascendant',
          actor: 'Uranus',
          natalPlanet: 'Ascendant',
          aspect: 'Conjunction',
          orb: 0.5,
          impact: 92,
        },
      ],
      natal,
    ).themes[0];

    expect(saturn.pressure).toBeGreaterThan(uranus.pressure);
    expect(saturn.growth).toBeGreaterThan(50);
    expect(uranus.instability).toBeGreaterThan(saturn.instability);
    expect(uranus.visibility).toBeGreaterThan(saturn.visibility);
  });

  it('raises natal resonance when the transit repeats a natal aspect', () => {
    const repeating = extractLivedThemes(
      [
        {
          source: 'transit',
          label: 'Saturn Square natal Sun',
          actor: 'Saturn',
          natalPlanet: 'Sun',
          aspect: 'Square',
          orb: 1,
          impact: 80,
        },
      ],
      natal,
    ).themes[0];
    const novel = extractLivedThemes(
      [
        {
          source: 'transit',
          label: 'Uranus Square natal Venus',
          actor: 'Uranus',
          natalPlanet: 'Venus',
          aspect: 'Square',
          orb: 1,
          impact: 80,
        },
      ],
      natal,
    ).themes[0];
    expect(repeating.natalResonance).toBeGreaterThan(novel.natalResonance);
  });

  it('separates signal strength from interpretation confidence for Pluto-only activation', () => {
    const theme = extractLivedThemes(
      [
        {
          source: 'transit',
          label: 'Pluto Conjunction natal Sun',
          actor: 'Pluto',
          natalPlanet: 'Sun',
          aspect: 'Conjunction',
          orb: 0.4,
          impact: 96,
        },
      ],
      natal,
    ).themes[0];
    expect(theme.signalStrength).toBeGreaterThan(theme.interpretationConfidence);
    expect(theme.interpretationConfidence).toBeLessThan(70);
  });

  it('detects contradiction as expansion under constraint, not an average', () => {
    const theme = extractLivedThemes(
      [
        {
          source: 'transit',
          label: 'Saturn Square natal Sun',
          actor: 'Saturn',
          natalPlanet: 'Sun',
          aspect: 'Square',
          orb: 0.8,
          impact: 88,
        },
        {
          source: 'transit',
          label: 'Jupiter Conjunction natal Sun',
          actor: 'Jupiter',
          natalPlanet: 'Sun',
          aspect: 'Conjunction',
          orb: 0.7,
          impact: 80,
        },
      ],
      natal,
    ).themes[0];
    expect(theme.theme).toBe('expansion under constraint');
    expect(theme.internalTension).toBeGreaterThan(50);
    expect(theme.pressure).toBeGreaterThan(40);
    expect(theme.growth).toBeGreaterThan(40);
  });

  it('weights user planet resonance without rewriting the domain', () => {
    const signals: ThemeSignal[] = [
      {
        source: 'transit',
        label: 'Saturn Square natal Sun',
        actor: 'Saturn',
        natalPlanet: 'Sun',
        aspect: 'Square',
        orb: 0.8,
        impact: 80,
      },
    ];
    const base = extractLivedThemes(signals, natal).themes[0];
    const boosted = extractLivedThemes(signals, natal, { planetWeights: { Saturn: 1.3 } }).themes[0];
    expect(boosted.impact).toBeGreaterThanOrEqual(base.impact);
    expect(Object.keys(boosted.domains)).toEqual(Object.keys(base.domains));
  });
});
