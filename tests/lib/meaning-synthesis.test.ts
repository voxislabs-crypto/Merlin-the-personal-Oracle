import { extractLivedThemes, type ThemeSignal } from '@/lib/astrology/lived-themes';
import {
  meaningDensity,
  synthesizeReflection,
  themeCoherence,
  withReflection,
} from '@/lib/astrology/meaning-synthesis';
import type { PlanetPosition } from '@/types/astrology';

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

function signal(
  actor: string,
  aspect: string,
  natalPlanet: string,
  impact = 88,
  source: ThemeSignal['source'] = 'transit',
): ThemeSignal {
  return {
    source,
    label: `${source === 'transit' ? '' : source + ' '}${actor} ${aspect} natal ${natalPlanet}`.trim(),
    actor,
    natalPlanet,
    aspect,
    orb: 0.7,
    impact,
  };
}

describe('meaning synthesis', () => {
  it('lifts identity restructuring into a maturation meta-theme with subthemes', () => {
    const packet = extractLivedThemes(
      [
        signal('Saturn', 'Square', 'Sun'),
        signal('Pluto', 'Opposition', 'Sun'),
        signal('Sun', 'Square', 'Saturn', 80, 'progression'),
      ],
      natal,
    );
    const reflection = synthesizeReflection(packet);
    expect(reflection?.metaTheme).toBe('maturation');
    expect(reflection?.hierarchy.theme).toMatch(/identity|responsibility/i);
    expect(reflection?.subThemes).toEqual(
      expect.arrayContaining(['responsibility', 'self-definition', 'authority']),
    );
    expect(reflection?.developmentalStage).toMatch(/consolidation|deep-restructuring|integration/);
    expect(reflection?.framing).toBe('reflection');
  });

  it('describes a tension, not a narrative about what will happen', () => {
    const packet = extractLivedThemes(
      [signal('Saturn', 'Square', 'Sun'), signal('Pluto', 'Opposition', 'Sun')],
      natal,
    );
    const reflection = synthesizeReflection(packet);
    expect(reflection?.coreTension).toMatch(/while|versus|rather than/i);
    expect(reflection?.coreTension).not.toMatch(/you are entering|will happen|prediction/i);
    expect(reflection?.reflectivePrompt).toMatch(/\?$/);
    expect(reflection?.reflectivePrompt.toLowerCase()).toContain('who you are becoming');
  });

  it('names the interaction between career duty and relationship themes', () => {
    const packet = extractLivedThemes(
      [
        signal('Saturn', 'Square', 'Midheaven'),
        signal('Venus', 'Opposition', 'Descendant', 70),
        signal('Mars', 'Square', 'Venus', 68),
      ],
      natal,
    );
    const reflection = synthesizeReflection(packet);
    expect(reflection?.interactions[0]?.interaction).toMatch(/role conflict|bond|structure/i);
  });

  it('ranks coherent stacks above a pile of unrelated medium hits', () => {
    const coherent = extractLivedThemes(
      [signal('Saturn', 'Square', 'Sun', 86), signal('Pluto', 'Opposition', 'Sun', 84, 'solar-arc')],
      natal,
    ).themes[0];
    const scatterSignals: ThemeSignal[] = [
      signal('Mercury', 'Sextile', 'Jupiter', 55),
      signal('Venus', 'Trine', 'Neptune', 54),
      signal('Mars', 'Sextile', 'Uranus', 53),
      signal('Moon', 'Trine', 'Venus', 52),
    ];
    const scattered = extractLivedThemes(scatterSignals, natal).themes[0];
    const coherentDensity = meaningDensity(coherent, 1);
    const scatterDensity = meaningDensity(scattered, 4);
    expect(themeCoherence(coherent, 1)).toBeGreaterThan(themeCoherence(scattered, 4));
    expect(coherentDensity).toBeGreaterThan(scatterDensity);
  });

  it('treats Pluto on the ASC as visible and Neptune on the Moon as interior', () => {
    const visible = synthesizeReflection(
      extractLivedThemes([signal('Pluto', 'Conjunction', 'Ascendant', 94)], natal),
    );
    const interior = synthesizeReflection(
      extractLivedThemes([signal('Neptune', 'Conjunction', 'Moon', 90)], natal),
    );
    expect(visible?.externalVisibility).toBeGreaterThan(interior?.externalVisibility || 0);
    expect(interior?.internalIntensity).toBeGreaterThan(visible?.externalVisibility ? 40 : 0);
    expect(interior?.internalIntensity).toBeGreaterThan(interior?.externalVisibility || 0);
  });

  it('marks saturn/pluto processes as long-term, not passing weather', () => {
    const reflection = synthesizeReflection(
      extractLivedThemes([signal('Saturn', 'Square', 'Sun')], natal),
    );
    expect(reflection?.persistence).toBe('long-term');
    expect(reflection?.archetype).toMatch(/builder|alchemist|guardian|weaver/);
  });

  it('attaches reflection when wrapping a lived packet', () => {
    const wrapped = withReflection(
      extractLivedThemes([signal('Saturn', 'Square', 'Sun')], natal),
    );
    expect(wrapped.reflection?.framing).toBe('reflection');
    expect(wrapped.reflection?.meaningDensity).toBeGreaterThan(40);
  });
});
